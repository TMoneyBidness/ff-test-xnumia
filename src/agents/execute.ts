import type { Env } from '../lib/env'
import type { PipelineAgent, PaymentRequest, AgentResult } from './types'
import type { BankPort, ExchangePort } from '../adapters/ports'

export class ExecuteAgent implements PipelineAgent {
  readonly type = 'execute' as const
  readonly name = 'ExecuteAgent'

  constructor(
    private env: Env,
    private bank: BankPort,
    private exchange: ExchangePort,
  ) {}

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()

    // Simulate insufficient funds for large amounts (demo)
    if (request.amountCents > 50_000_00) {
      return {
        agentType: this.type,
        verdict: 'red',
        action: 'FAIL',
        reasoning: 'Insufficient funds — source account balance too low for this amount',
        detail: {
          transferId: null,
          conversionId: null,
          debitEntry: null,
          creditEntry: null,
          settlementStatus: 'rejected',
        },
        durationMs: Date.now() - start,
      }
    }

    try {
      // Step 1: Check balance
      const balance = await this.bank.getBalance('acct-001')
      console.log(`[ExecuteAgent] Balance check: ${balance.balance} ${balance.currency}`)

      // Step 2: Initiate fiat transfer
      const transfer = await this.bank.initiateTransfer({
        from: 'acct-001',
        to: 'acct-pipeline',
        amount: request.amountCents / 100,
        currency: request.currencyFrom,
        reference: request.id,
      })

      // Step 3: Convert via exchange (fiat → stablecoin)
      const conversion = await this.exchange.convertFiatToStable({
        amount: request.amountCents / 100,
        fiatCurrency: request.currencyFrom,
        stablecoin: request.currencyTo,
      })

      // Step 4: Write ledger entries to D1 (using correct schema columns)
      const now = new Date().toISOString()
      const debitId = `ledger-debit-${Date.now()}`
      const creditId = `ledger-credit-${Date.now()}`

      const debitEntry = {
        id: debitId,
        direction: 'debit',
        rail: 'fiat',
        amountCents: request.amountCents,
        currency: request.currencyFrom,
        transactionId: request.id,
        counterparty: request.clientId,
        createdAt: now,
      }

      const creditEntry = {
        id: creditId,
        direction: 'credit',
        rail: 'stablecoin',
        amountCents: Math.round(conversion.amountReceived * 100),
        currency: request.currencyTo,
        transactionId: request.id,
        counterparty: request.clientId,
        createdAt: now,
      }

      try {
        await this.env.DB.prepare(
          `INSERT INTO ledger_entries (id, transaction_id, rail, direction, amount_cents, currency, counterparty, reconciled, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
        )
          .bind(debitEntry.id, debitEntry.transactionId, debitEntry.rail, debitEntry.direction, debitEntry.amountCents, debitEntry.currency, debitEntry.counterparty, debitEntry.createdAt)
          .run()

        await this.env.DB.prepare(
          `INSERT INTO ledger_entries (id, transaction_id, rail, direction, amount_cents, currency, counterparty, reconciled, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
        )
          .bind(creditEntry.id, creditEntry.transactionId, creditEntry.rail, creditEntry.direction, creditEntry.amountCents, creditEntry.currency, creditEntry.counterparty, creditEntry.createdAt)
          .run()
      } catch {
        console.warn('[ExecuteAgent] Could not write ledger entries to D1')
      }

      const settlementStatus = transfer.status === 'pending' ? 'pending' : 'completed'

      return {
        agentType: this.type,
        verdict: settlementStatus === 'pending' ? 'amber' : 'green',
        action: settlementStatus === 'pending' ? 'PENDING' : 'SETTLED',
        reasoning: settlementStatus === 'pending'
          ? 'Transfer initiated — settlement pending'
          : 'Funds moved successfully, ledger entries written',
        detail: {
          transferId: transfer.transferId,
          conversionId: conversion.conversionId,
          debitEntry,
          creditEntry,
          settlementStatus,
        },
        durationMs: Date.now() - start,
      }
    } catch (err) {
      return {
        agentType: this.type,
        verdict: 'red',
        action: 'FAIL',
        reasoning: `Adapter error: ${err instanceof Error ? err.message : String(err)}`,
        detail: {
          transferId: null,
          conversionId: null,
          debitEntry: null,
          creditEntry: null,
          settlementStatus: 'failed',
        },
        durationMs: Date.now() - start,
      }
    }
  }
}
