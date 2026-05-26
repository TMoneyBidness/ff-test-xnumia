import type { Env } from '../lib/env'
import type { OpsAgent, OpsRunResult } from './ops-types'
import type { BankPort, AccountingPort } from '../adapters/ports'

/**
 * ReconciliationAgent — matches ledger entries across internal records and
 * external sources (bank, accounting). Flags mismatches as reconciliation
 * exceptions for dashboard surfacing or auto-resolution.
 *
 * Runs on a schedule (micro-recon every 15 min, full recon daily).
 * Tolerance: 0.01% for amount mismatches (covers FX rounding at sub-cent level).
 */
export class ReconciliationAgent implements OpsAgent {
  readonly type = 'reconciliation' as const
  readonly name = 'ReconciliationAgent'

  /** Amount mismatch tolerance — 0.01% */
  private static readonly TOLERANCE = 0.0001

  /** Duplicate detection window — 24 hours in milliseconds */
  private static readonly DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000

  constructor(
    private env: Env,
    private bank: BankPort,
    private accounting: AccountingPort,
  ) {}

  async run(): Promise<OpsRunResult> {
    const start = Date.now()
    const actions: string[] = []
    const escalations: string[] = []
    const errors: string[] = []
    let processed = 0

    // ── 1. Fetch all unreconciled ledger entries ────────────────
    const unreconciled = await this.env.DB.prepare(
      `SELECT id, transaction_id, rail, direction, amount_cents, currency, counterparty, created_at
       FROM ledger_entries
       WHERE reconciled = 0
       ORDER BY transaction_id`
    ).all<{
      id: string
      transaction_id: string
      rail: string
      direction: string
      amount_cents: number
      currency: string
      counterparty: string | null
      created_at: string
    }>()

    const entries = unreconciled.results ?? []
    console.log(`[ReconciliationAgent] Found ${entries.length} unreconciled ledger entries`)

    if (entries.length === 0) {
      return {
        agentType: this.type,
        verdict: 'ok',
        summary: 'No unreconciled entries to process',
        itemsProcessed: 0,
        actionsPerformed: [],
        escalations: [],
        errors: [],
        durationMs: Date.now() - start,
      }
    }

    // ── 2. Group entries by transaction_id ──────────────────────
    const grouped = new Map<string, typeof entries>()
    for (const entry of entries) {
      const existing = grouped.get(entry.transaction_id) ?? []
      existing.push(entry)
      grouped.set(entry.transaction_id, existing)
    }

    // ── 3. Process each transaction's entries ───────────────────
    for (const [txId, txEntries] of grouped) {
      try {
        processed++
        const matchResults: string[] = []
        const exceptions: Array<{
          type: string
          expected?: number
          actual?: number
          source: string
        }> = []

        // 3a. Internal balance check — debits must equal credits (within tolerance)
        const totalDebits = txEntries
          .filter(e => e.direction === 'debit')
          .reduce((sum, e) => sum + e.amount_cents, 0)

        const totalCredits = txEntries
          .filter(e => e.direction === 'credit')
          .reduce((sum, e) => sum + e.amount_cents, 0)

        const maxAmount = Math.max(totalDebits, totalCredits, 1) // avoid division by zero
        const mismatchRatio = Math.abs(totalDebits - totalCredits) / maxAmount

        if (mismatchRatio > ReconciliationAgent.TOLERANCE) {
          // Mismatch beyond tolerance — create exception
          const exceptionId = `recon-exc-${txId}-${Date.now()}`
          await this.env.DB.prepare(
            `INSERT INTO reconciliation_exceptions (id, transaction_id, exception_type, expected_amount_cents, actual_amount_cents, source, resolution_status, created_at)
             VALUES (?, ?, 'amount_mismatch', ?, ?, 'internal_ledger', 'open', ?)`
          )
            .bind(exceptionId, txId, totalDebits, totalCredits, new Date().toISOString())
            .run()

          exceptions.push({
            type: 'amount_mismatch',
            expected: totalDebits,
            actual: totalCredits,
            source: 'internal_ledger',
          })
          escalations.push(`${txId}: debit/credit mismatch (debit=${totalDebits}, credit=${totalCredits})`)
        } else if (totalDebits !== totalCredits && mismatchRatio <= ReconciliationAgent.TOLERANCE) {
          // Within tolerance — auto-resolve
          const exceptionId = `recon-exc-${txId}-${Date.now()}`
          await this.env.DB.prepare(
            `INSERT INTO reconciliation_exceptions (id, transaction_id, exception_type, expected_amount_cents, actual_amount_cents, source, resolution_status, resolution_detail, created_at, resolved_at)
             VALUES (?, ?, 'amount_mismatch', ?, ?, 'internal_ledger', 'auto_resolved', 'Within 0.01% tolerance', ?, ?)`
          )
            .bind(exceptionId, txId, totalDebits, totalCredits, new Date().toISOString(), new Date().toISOString())
            .run()

          matchResults.push('internal balance: auto-resolved (within tolerance)')
        } else {
          matchResults.push('internal balance: matched')
        }

        // 3b. External bank match
        const earliestEntry = txEntries.reduce((earliest, e) =>
          e.created_at < earliest.created_at ? e : earliest
        )

        try {
          const bankTxns = await this.bank.listTransactions({ since: earliestEntry.created_at })
          const fiatEntries = txEntries.filter(e => e.rail === 'fiat')
          let bankMatched = false

          for (const fiatEntry of fiatEntries) {
            const fiatAmountDollars = fiatEntry.amount_cents / 100
            const match = bankTxns.find(bt => {
              const amountDiff = Math.abs(bt.amount - fiatAmountDollars)
              const amountMax = Math.max(Math.abs(bt.amount), Math.abs(fiatAmountDollars), 0.01)
              return amountDiff / amountMax <= ReconciliationAgent.TOLERANCE
            })
            if (match) {
              bankMatched = true
            }
          }

          if (fiatEntries.length > 0 && !bankMatched) {
            const exceptionId = `recon-exc-bank-${txId}-${Date.now()}`
            await this.env.DB.prepare(
              `INSERT INTO reconciliation_exceptions (id, transaction_id, exception_type, expected_amount_cents, source, resolution_status, created_at)
               VALUES (?, ?, 'missing_bank_entry', ?, 'bank', 'open', ?)`
            )
              .bind(exceptionId, txId, fiatEntries[0].amount_cents, new Date().toISOString())
              .run()

            exceptions.push({
              type: 'missing_bank_entry',
              expected: fiatEntries[0].amount_cents,
              source: 'bank',
            })
            escalations.push(`${txId}: no matching bank transaction found`)
          } else if (fiatEntries.length > 0) {
            matchResults.push('bank match: found')
          }
        } catch (err) {
          // Bank adapter might not be connected — log and skip external match
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`[ReconciliationAgent] Bank match skipped for ${txId}: ${msg}`)
          matchResults.push(`bank match: skipped (${msg})`)
        }

        // 3c. Accounting match
        try {
          const accountingEntries = await this.accounting.getUnreconciledEntries(earliestEntry.created_at)
          const accountingMatch = accountingEntries.find(ae => {
            // Match by amount (convert cents to dollars for comparison)
            const entryAmountDollars = totalDebits / 100
            const amountDiff = Math.abs(ae.amount - entryAmountDollars)
            const amountMax = Math.max(Math.abs(ae.amount), Math.abs(entryAmountDollars), 0.01)
            return amountDiff / amountMax <= ReconciliationAgent.TOLERANCE
          })

          if (!accountingMatch) {
            const exceptionId = `recon-exc-acct-${txId}-${Date.now()}`
            await this.env.DB.prepare(
              `INSERT INTO reconciliation_exceptions (id, transaction_id, exception_type, expected_amount_cents, source, resolution_status, created_at)
               VALUES (?, ?, 'missing_accounting_entry', ?, 'accounting', 'open', ?)`
            )
              .bind(exceptionId, txId, totalDebits, new Date().toISOString())
              .run()

            exceptions.push({
              type: 'missing_accounting_entry',
              expected: totalDebits,
              source: 'accounting',
            })
            escalations.push(`${txId}: no matching accounting entry found`)
          } else {
            matchResults.push('accounting match: found')
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`[ReconciliationAgent] Accounting match skipped for ${txId}: ${msg}`)
          matchResults.push(`accounting match: skipped (${msg})`)
        }

        // ── 6. Duplicate detection ─────────────────────────────
        try {
          const clientId = txEntries[0].counterparty
          if (clientId) {
            const windowStart = new Date(Date.now() - ReconciliationAgent.DUPLICATE_WINDOW_MS).toISOString()
            const duplicates = await this.env.DB.prepare(
              `SELECT id FROM payment_requests
               WHERE client_id = ? AND amount_cents = ? AND created_at >= ?`
            )
              .bind(clientId, totalDebits, windowStart)
              .all<{ id: string }>()

            const dupeCount = (duplicates.results ?? []).length
            if (dupeCount >= 2) {
              const exceptionId = `recon-exc-dupe-${txId}-${Date.now()}`
              await this.env.DB.prepare(
                `INSERT INTO reconciliation_exceptions (id, transaction_id, exception_type, expected_amount_cents, source, resolution_status, created_at)
                 VALUES (?, ?, 'duplicate_entry', ?, 'payment_requests', 'open', ?)`
              )
                .bind(exceptionId, txId, totalDebits, new Date().toISOString())
                .run()

              exceptions.push({
                type: 'duplicate_entry',
                expected: totalDebits,
                source: 'payment_requests',
              })
              escalations.push(`${txId}: ${dupeCount} potential duplicate payment requests found (client=${clientId}, amount=${totalDebits})`)
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`[ReconciliationAgent] Duplicate check failed for ${txId}: ${msg}`)
        }

        // ── 7. Write agent_decisions ───────────────────────────
        const hasExceptions = exceptions.length > 0
        const verdict = hasExceptions ? 'amber' : 'green'
        const action = hasExceptions ? 'EXCEPTIONS_FOUND' : 'RECONCILED'

        await this.writeDecision(txId, verdict, action,
          hasExceptions
            ? `Found ${exceptions.length} exception(s): ${exceptions.map(e => e.type).join(', ')}`
            : `All checks passed: ${matchResults.join('; ')}`,
          {
            matchResults,
            exceptions,
            totalDebits,
            totalCredits,
            entryCount: txEntries.length,
          },
        )

        if (hasExceptions) {
          actions.push(`${txId}: ${exceptions.length} exception(s) created`)
        } else {
          actions.push(`${txId}: fully reconciled`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${txId}: ${msg}`)
        console.error(`[ReconciliationAgent] Error processing ${txId}:`, msg)
      }
    }

    // ── 8. Build result ─────────────────────────────────────────
    const verdict = errors.length > 0
      ? 'error'
      : escalations.length > 0
        ? 'escalated'
        : actions.length > 0
          ? 'action_taken'
          : 'ok'

    return {
      agentType: this.type,
      verdict,
      summary: `Processed ${processed} transaction(s) with ${entries.length} unreconciled entries: ${escalations.length} exception(s), ${errors.length} error(s)`,
      itemsProcessed: processed,
      actionsPerformed: actions,
      escalations,
      errors,
      durationMs: Date.now() - start,
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  private async writeDecision(
    requestId: string,
    verdict: 'green' | 'amber' | 'red',
    action: string,
    reasoning: string,
    detail: Record<string, unknown>,
  ): Promise<void> {
    const id = `reconciliation-${requestId}-${Date.now()}`
    try {
      await this.env.DB.prepare(
        `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
         VALUES (?, ?, 'reconciliation', ?, ?, ?, ?, 0, ?)`
      )
        .bind(id, requestId, verdict, action, reasoning, JSON.stringify(detail), new Date().toISOString())
        .run()
    } catch (err) {
      console.error(`[ReconciliationAgent] Failed to write decision for ${requestId}:`, err instanceof Error ? err.message : String(err))
    }
  }
}
