import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../lib/env';

type TxState =
  | 'INITIATED'
  | 'PENDING_PSP'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'RECONCILED'
  | 'FAILED'
  | 'RETURNED'
  | 'HELD_FOR_REVIEW'
  | 'RETRY_PENDING';

/** Happy-path order used when no explicit targetState is provided on /advance. */
const HAPPY_PATH: TxState[] = [
  'INITIATED',
  'PENDING_PSP',
  'PENDING_SETTLEMENT',
  'SETTLED',
  'RECONCILED',
];

/** Allowed transitions per state. HELD_FOR_REVIEW is handled separately (can return to any previous_state). */
const TRANSITIONS: Record<TxState, TxState[]> = {
  INITIATED: ['PENDING_PSP', 'FAILED', 'HELD_FOR_REVIEW'],
  PENDING_PSP: ['PENDING_SETTLEMENT', 'FAILED', 'HELD_FOR_REVIEW'],
  PENDING_SETTLEMENT: ['SETTLED', 'FAILED', 'RETURNED', 'HELD_FOR_REVIEW'],
  SETTLED: ['RECONCILED', 'HELD_FOR_REVIEW'],
  RECONCILED: [], // terminal
  FAILED: ['RETRY_PENDING'],
  RETURNED: ['FAILED'],
  HELD_FOR_REVIEW: [], // release restores previous_state dynamically
  RETRY_PENDING: ['INITIATED'],
};

const TERMINAL_STATES: TxState[] = ['RECONCILED'];
const DEFAULT_MAX_RETRIES = 3;

interface Transaction {
  id: string;
  state: TxState;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  maxRetries: number;
  previousState: TxState | null;
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
        updated_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT ${DEFAULT_MAX_RETRIES},
        previous_state TEXT
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
      if (request.method === 'POST' && pathname === '/hold') {
        return this.handleHold(request);
      }
      if (request.method === 'POST' && pathname === '/release') {
        return this.handleRelease(request);
      }
      if (request.method === 'POST' && pathname === '/fail') {
        return this.handleFail(request);
      }
      if (request.method === 'POST' && pathname === '/retry') {
        return this.handleRetry(request);
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

  // ---------------------------------------------------------------------------
  // Route handlers
  // ---------------------------------------------------------------------------

  private async handleCreate(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string; maxRetries?: number };
    const id = body.txId ?? crypto.randomUUID();
    const now = Date.now();
    const state: TxState = 'INITIATED';
    const maxRetries = body.maxRetries ?? DEFAULT_MAX_RETRIES;

    this.ctx.storage.sql.exec(
      `INSERT INTO transactions (id, state, created_at, updated_at, retry_count, max_retries, previous_state) VALUES (?, ?, ?, ?, 0, ?, NULL)`,
      id,
      state,
      now,
      now,
      maxRetries,
    );

    this.recordDecision(id, state, null, 'Transaction created');

    const tx: Transaction = {
      id,
      state,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries,
      previousState: null,
    };
    return Response.json(tx, { status: 201 });
  }

  private async handleAdvance(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      txId?: string;
      targetState?: TxState;
      reason?: string;
    };
    const txId = body.txId;
    if (!txId) {
      return Response.json({ error: 'txId is required' }, { status: 400 });
    }

    const tx = this.loadTransaction(txId);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    let targetState: TxState;

    if (body.targetState) {
      // Explicit target — validate it is an allowed transition.
      targetState = body.targetState;
      if (!this.isAllowedTransition(tx.state, targetState)) {
        return Response.json(
          { error: `Transition from ${tx.state} to ${targetState} is not allowed` },
          { status: 409 },
        );
      }
    } else {
      // Backward-compatible: advance along the happy path.
      const currentIndex = HAPPY_PATH.indexOf(tx.state);
      if (currentIndex === -1 || currentIndex >= HAPPY_PATH.length - 1) {
        return Response.json(
          { error: `Cannot advance beyond ${tx.state}` },
          { status: 409 },
        );
      }
      targetState = HAPPY_PATH[currentIndex + 1];
    }

    return this.transitionTo(tx, targetState, body.reason ?? 'State advanced');
  }

  private async handleHold(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string; reason?: string };
    const txId = body.txId;
    if (!txId) {
      return Response.json({ error: 'txId is required' }, { status: 400 });
    }

    const tx = this.loadTransaction(txId);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (TERMINAL_STATES.includes(tx.state)) {
      return Response.json(
        { error: `Cannot hold a transaction in terminal state ${tx.state}` },
        { status: 409 },
      );
    }

    if (tx.state === 'HELD_FOR_REVIEW') {
      return Response.json(
        { error: 'Transaction is already held for review' },
        { status: 409 },
      );
    }

    const reason = body.reason ?? 'Held for review';

    // Store current state as previous_state so /release can restore it.
    const now = Date.now();
    this.ctx.storage.sql.exec(
      `UPDATE transactions SET state = ?, updated_at = ?, previous_state = ? WHERE id = ?`,
      'HELD_FOR_REVIEW' as TxState,
      now,
      tx.state,
      txId,
    );
    this.recordDecision(txId, 'HELD_FOR_REVIEW', tx.state, reason);

    return Response.json({
      ...tx,
      state: 'HELD_FOR_REVIEW' as TxState,
      updatedAt: now,
      previousState: tx.state,
    });
  }

  private async handleRelease(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string; reason?: string };
    const txId = body.txId;
    if (!txId) {
      return Response.json({ error: 'txId is required' }, { status: 400 });
    }

    const tx = this.loadTransaction(txId);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'HELD_FOR_REVIEW') {
      return Response.json(
        { error: 'Transaction is not in HELD_FOR_REVIEW state' },
        { status: 409 },
      );
    }

    if (!tx.previousState) {
      return Response.json(
        { error: 'No previous state recorded; cannot release' },
        { status: 500 },
      );
    }

    const restoreState = tx.previousState;
    const reason = body.reason ?? `Released from review, restored to ${restoreState}`;
    const now = Date.now();

    this.ctx.storage.sql.exec(
      `UPDATE transactions SET state = ?, updated_at = ?, previous_state = NULL WHERE id = ?`,
      restoreState,
      now,
      txId,
    );
    this.recordDecision(txId, restoreState, 'HELD_FOR_REVIEW', reason);

    return Response.json({
      ...tx,
      state: restoreState,
      updatedAt: now,
      previousState: null,
    });
  }

  private async handleFail(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string; reason?: string };
    const txId = body.txId;
    if (!txId) {
      return Response.json({ error: 'txId is required' }, { status: 400 });
    }

    const tx = this.loadTransaction(txId);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!this.isAllowedTransition(tx.state, 'FAILED')) {
      return Response.json(
        { error: `Cannot fail a transaction in state ${tx.state}` },
        { status: 409 },
      );
    }

    return this.transitionTo(tx, 'FAILED', body.reason ?? 'Transaction failed');
  }

  private async handleRetry(request: Request): Promise<Response> {
    const body = (await request.json()) as { txId?: string; reason?: string };
    const txId = body.txId;
    if (!txId) {
      return Response.json({ error: 'txId is required' }, { status: 400 });
    }

    const tx = this.loadTransaction(txId);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.state !== 'FAILED') {
      return Response.json(
        { error: 'Only FAILED transactions can be retried' },
        { status: 409 },
      );
    }

    if (tx.retryCount >= tx.maxRetries) {
      return Response.json(
        {
          error: `Max retries (${tx.maxRetries}) reached`,
          retryCount: tx.retryCount,
          maxRetries: tx.maxRetries,
        },
        { status: 409 },
      );
    }

    const newRetryCount = tx.retryCount + 1;
    const now = Date.now();
    const reason =
      body.reason ?? `Retry ${newRetryCount}/${tx.maxRetries} scheduled`;

    this.ctx.storage.sql.exec(
      `UPDATE transactions SET state = ?, updated_at = ?, retry_count = ? WHERE id = ?`,
      'RETRY_PENDING' as TxState,
      now,
      newRetryCount,
      txId,
    );
    this.recordDecision(txId, 'RETRY_PENDING', 'FAILED', reason);

    return Response.json({
      ...tx,
      state: 'RETRY_PENDING' as TxState,
      updatedAt: now,
      retryCount: newRetryCount,
    });
  }

  private async handleStatus(): Promise<Response> {
    const row = this.ctx.storage.sql
      .exec(
        `SELECT id, state, created_at, updated_at, retry_count, max_retries, previous_state FROM transactions LIMIT 1`,
      )
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
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      previousState: row.previous_state,
      decisions: decisions.map((d) => ({
        state: d.state,
        previousState: d.previous_state,
        timestamp: d.timestamp,
        reason: d.reason,
      })),
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private loadTransaction(txId: string): Transaction | null {
    const row = this.ctx.storage.sql
      .exec(
        `SELECT id, state, created_at, updated_at, retry_count, max_retries, previous_state FROM transactions WHERE id = ?`,
        txId,
      )
      .one();

    if (!row) return null;

    return {
      id: row.id as string,
      state: row.state as TxState,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      retryCount: row.retry_count as number,
      maxRetries: row.max_retries as number,
      previousState: (row.previous_state as TxState) ?? null,
    };
  }

  private isAllowedTransition(from: TxState, to: TxState): boolean {
    const allowed = TRANSITIONS[from];
    return allowed !== undefined && allowed.includes(to);
  }

  private transitionTo(
    tx: Transaction,
    targetState: TxState,
    reason: string,
  ): Response {
    const now = Date.now();

    this.ctx.storage.sql.exec(
      `UPDATE transactions SET state = ?, updated_at = ? WHERE id = ?`,
      targetState,
      now,
      tx.id,
    );

    this.recordDecision(tx.id, targetState, tx.state, reason);

    return Response.json({
      id: tx.id,
      state: targetState,
      createdAt: tx.createdAt,
      updatedAt: now,
      retryCount: tx.retryCount,
      maxRetries: tx.maxRetries,
      previousState: tx.previousState,
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
