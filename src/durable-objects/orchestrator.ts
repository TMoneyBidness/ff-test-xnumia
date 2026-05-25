import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../lib/env';

type TxState =
  | 'INITIATED'
  | 'PENDING_PSP'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'RECONCILED'
  | 'FAILED';

const STATE_ORDER: TxState[] = [
  'INITIATED',
  'PENDING_PSP',
  'PENDING_SETTLEMENT',
  'SETTLED',
  'RECONCILED',
];

interface Transaction {
  id: string;
  state: TxState;
  createdAt: number;
  updatedAt: number;
}

interface Decision {
  state: TxState;
  previousState: TxState | null;
  timestamp: number;
  reason: string;
}

export class OrchestratorDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ensureSchema();
  }

  private ensureSchema(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_id TEXT NOT NULL,
        state TEXT NOT NULL,
        previous_state TEXT,
        timestamp INTEGER NOT NULL,
        reason TEXT NOT NULL,
        FOREIGN KEY (tx_id) REFERENCES transactions(id)
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      if (request.method === 'POST' && pathname === '/create') {
        return this.handleCreate(request);
      }
      if (request.method === 'POST' && pathname === '/advance') {
        return this.handleAdvance(request);
      }
      if (request.method === 'GET' && pathname === '/status') {
        return this.handleStatus();
      }
      if (request.method === 'GET' && pathname === '/ping') {
        return Response.json({ pong: true, id: this.ctx.id.toString() });
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return Response.json({ error: message }, { status: 500 });
    }
  }

  private async handleCreate(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string };
    const id = body.txId ?? crypto.randomUUID();
    const now = Date.now();
    const state: TxState = 'INITIATED';

    this.ctx.storage.sql.exec(
      `INSERT INTO transactions (id, state, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      id,
      state,
      now,
      now,
    );

    this.recordDecision(id, state, null, 'Transaction created');

    const tx: Transaction = { id, state, createdAt: now, updatedAt: now };
    return Response.json(tx, { status: 201 });
  }

  private async handleAdvance(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string; reason?: string };
    const txId = body.txId;
    if (!txId) {
      return Response.json({ error: 'txId is required' }, { status: 400 });
    }

    const row = this.ctx.storage.sql
      .exec(`SELECT id, state, created_at, updated_at FROM transactions WHERE id = ?`, txId)
      .one();

    if (!row) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const currentState = row.state as TxState;
    const currentIndex = STATE_ORDER.indexOf(currentState);

    if (currentState === 'FAILED') {
      return Response.json({ error: 'Transaction is in FAILED state and cannot advance' }, { status: 409 });
    }

    if (currentIndex === -1 || currentIndex >= STATE_ORDER.length - 1) {
      return Response.json({ error: `Cannot advance beyond ${currentState}` }, { status: 409 });
    }

    const nextState = STATE_ORDER[currentIndex + 1];
    const now = Date.now();

    this.ctx.storage.sql.exec(
      `UPDATE transactions SET state = ?, updated_at = ? WHERE id = ?`,
      nextState,
      now,
      txId,
    );

    this.recordDecision(txId, nextState, currentState, body.reason ?? 'State advanced');

    const tx: Transaction = {
      id: txId,
      state: nextState,
      createdAt: row.created_at as number,
      updatedAt: now,
    };
    return Response.json(tx);
  }

  private async handleStatus(): Promise<Response> {
    const row = this.ctx.storage.sql
      .exec(`SELECT id, state, created_at, updated_at FROM transactions LIMIT 1`)
      .one();

    if (!row) {
      return Response.json({ error: 'No transaction found' }, { status: 404 });
    }

    const decisions = [
      ...this.ctx.storage.sql.exec(
        `SELECT state, previous_state, timestamp, reason FROM decisions WHERE tx_id = ? ORDER BY timestamp ASC`,
        row.id as string,
      ),
    ];

    return Response.json({
      id: row.id,
      state: row.state,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      decisions: decisions.map((d) => ({
        state: d.state,
        previousState: d.previous_state,
        timestamp: d.timestamp,
        reason: d.reason,
      })),
    });
  }

  private recordDecision(
    txId: string,
    state: TxState,
    previousState: TxState | null,
    reason: string,
  ): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO decisions (tx_id, state, previous_state, timestamp, reason) VALUES (?, ?, ?, ?, ?)`,
      txId,
      state,
      previousState,
      Date.now(),
      reason,
    );
  }
}
