import type { Env } from '../lib/env';

interface QueueMessage {
  type: string;
  payload: Record<string, unknown>;
}

export async function handleQueue(
  batch: MessageBatch<QueueMessage>,
  env: Env,
): Promise<void> {
  for (const msg of batch.messages) {
    try {
      const { type, payload } = msg.body;

      switch (type) {
        case 'advance-tx': {
          const txId = payload.txId as string;
          const id = env.ORCHESTRATOR.idFromName(txId);
          const stub = env.ORCHESTRATOR.get(id);
          await stub.fetch(new Request('https://do/advance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txId, reason: 'Queued advance' }),
          }));
          msg.ack();
          break;
        }

        case 'start-workflow': {
          await env.ENGAGEMENT_WORKFLOW.create({
            params: {
              engagementId: payload.engagementId as string,
              tenantId: payload.tenantId as string,
            },
          });
          msg.ack();
          break;
        }

        default:
          console.error(`Unknown queue message type: ${type}`);
          msg.ack();
          break;
      }
    } catch (err) {
      console.error('Queue message processing failed, retrying:', err);
      msg.retry();
    }
  }
}
