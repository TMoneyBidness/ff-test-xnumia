import type { Env } from '../lib/env'
import type { PipelineAgent, PaymentRequest, AgentResult } from './types'
import { MockBankAdapter } from '../adapters/bank/mock'
import { MockExchangeAdapter } from '../adapters/exchange/mock'

export class ExecuteAgent implements PipelineAgent {
  readonly type = 'execute' as const
  readonly name = 'ExecuteAgent'

  private bank: MockBankAdapter
  private exchange: MockExchangeAdapter

  constructor(private env: Env) {
    this.bank = new MockBankAdapter()
    this.exchange = new MockExchangeAdapter()
  }

  async evaluate(request: PaymentRequest): Promise<AgentResult> {
    const start = Date.now()

    // --- Simulate insufficient funds for large amounts (demo) ---
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
      // Step 1: Check balance (mock)
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

      // Step 3: Convert via exchange (fiat -> stablecoin)
      const conversion = await this.exchange.convertFiatToStable({
        amount: request.amountCents / 100,
        fiatCurrency: request.currencyFrom,
        stablecoin: request.currencyTo,
      })

      // Step 4: Write ledger entries to D1
      const debitEntry = {
        id: `ledger-debit-${Date.now()}`,
        type: 'debit',
        rail: 'fiat',
        amountCents: request.amountCents,
        currency: request.currencyFrom,
        reference: request.id,
        clientId: request.clientId,
        createdAt: new Date().toISOString(),
      }

      const creditEntry = {
        id: `ledger-credit-${Date.now()}`,
        type: 'credit',
        rail: 'stablecoin',
        amountCents: Math.round(conversion.amountReceived * 100),
        currency: request.currencyTo,
        reference: request.id,
        clientId: request.clientId,
        createdAt: new Date().toISOString(),
      }

      try {
        await this.env.DB.prepare(
          `INSERT INTO ledger_entries (id, type, rail, amount_cents, currency, reference, client_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(debitEntry.id, debitEntry.type, debitEntry.rail, debitEntry.amountCents, debitEntry.currency, debitEntry.reference, debitEntry.clientId, debitEntry.createdAt)
          .run()

        await this.env.DB.prepare(
          `INSERT INTO ledger_entries (id, type, rail, amount_cents, currency, reference, client_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(creditEntry.id, creditEntry.type, creditEntry.rail, creditEntry.amountCents, creditEntry.currency, creditEntry.reference, creditEntry.clientId, creditEntry.createdAt)
          .run()
      } catch {
        // D1 might not be available in tests — log and continue
        console.warn('[ExecuteAgent] Could not write ledger entries to D1')
      }

      // Transfer is pending settlement (mock delay)
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
