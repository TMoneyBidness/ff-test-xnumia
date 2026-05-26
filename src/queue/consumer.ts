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

        case 'webhook-event': {
          const { webhookEventId, provider, eventType } = payload as {
            webhookEventId: string;
            provider: string;
            eventType: string;
          };

          try {
            // 1. Read webhook event from D1
            const eventRow = await env.DB.prepare(
              `SELECT * FROM webhook_events WHERE id = ?`
            ).bind(webhookEventId).first();

            if (!eventRow) {
              console.error(`[WebhookConsumer] Webhook event not found: ${webhookEventId}`);
              msg.ack();
              break;
            }

            // 2. Read raw payload from R2
            const r2Object = await env.DOCUMENTS.get(eventRow.raw_r2_key as string);
            if (!r2Object) {
              console.error(`[WebhookConsumer] R2 payload not found: ${eventRow.raw_r2_key}`);
              await env.DB.prepare(
                `UPDATE webhook_events SET status = 'failed' WHERE id = ?`
              ).bind(webhookEventId).run();
              msg.ack();
              break;
            }

            // 3. Parse payload JSON
            const rawPayload = await r2Object.text();
            const webhookPayload = JSON.parse(rawPayload) as Record<string, unknown>;

            // 4. Extract transaction reference (Stripe: payload.data.object.metadata.xnumia_reference)
            let txReference: string | undefined;
            if (provider === 'stripe') {
              const data = webhookPayload.data as Record<string, unknown> | undefined;
              const obj = data?.object as Record<string, unknown> | undefined;
              const metadata = obj?.metadata as Record<string, string> | undefined;
              txReference = metadata?.xnumia_reference;
            }

            if (!txReference) {
              console.error(`[WebhookConsumer] No transaction reference found in webhook ${webhookEventId}`);
              await env.DB.prepare(
                `UPDATE webhook_events SET status = 'failed' WHERE id = ?`
              ).bind(webhookEventId).run();
              msg.ack();
              break;
            }

            // 5. Look up the OrchestratorDO by transaction reference
            const doId = env.ORCHESTRATOR.idFromName(txReference);
            const stub = env.ORCHESTRATOR.get(doId);

            // 6. Route based on event type
            let doEndpoint: string;
            let doBody: Record<string, unknown>;

            switch (eventType) {
              case 'payment_intent.succeeded':
                doEndpoint = '/advance';
                doBody = { txId: txReference, targetState: 'PENDING_SETTLEMENT', reason: `Stripe ${eventType}` };
                break;
              case 'payment_intent.payment_failed': {
                const failData = webhookPayload.data as Record<string, unknown> | undefined;
                const failObj = failData?.object as Record<string, unknown> | undefined;
                const lastError = failObj?.last_payment_error as Record<string, unknown> | undefined;
                doEndpoint = '/fail';
                doBody = { txId: txReference, reason: (lastError?.message as string) || `Stripe ${eventType}` };
                break;
              }
              case 'payout.paid':
                doEndpoint = '/advance';
                doBody = { txId: txReference, targetState: 'SETTLED', reason: `Stripe ${eventType}` };
                break;
              case 'payout.failed': {
                const payoutData = webhookPayload.data as Record<string, unknown> | undefined;
                const payoutObj = payoutData?.object as Record<string, unknown> | undefined;
                doEndpoint = '/fail';
                doBody = { txId: txReference, reason: (payoutObj?.failure_message as string) || `Stripe ${eventType}` };
                break;
              }
              case 'charge.dispute.created':
                doEndpoint = '/hold';
                doBody = { txId: txReference, reason: 'Dispute received' };
                break;
              default:
                console.warn(`[WebhookConsumer] Unhandled event type: ${eventType}`);
                await env.DB.prepare(
                  `UPDATE webhook_events SET status = 'processed' WHERE id = ?`
                ).bind(webhookEventId).run();
                msg.ack();
                break;
            }

            // Call the DO endpoint
            await stub.fetch(new Request(`https://do${doEndpoint!}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(doBody!),
            }));

            // 7. Update webhook_events status to processed
            await env.DB.prepare(
              `UPDATE webhook_events SET status = 'processed' WHERE id = ?`
            ).bind(webhookEventId).run();

            // 8. Write agent_decisions entry
            await env.DB.prepare(
              `INSERT INTO agent_decisions (id, request_id, agent_type, verdict, action, reasoning, detail, duration_ms, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              crypto.randomUUID(),
              txReference,
              'orchestrator',
              'green',
              eventType,
              `Webhook ${eventType} processed for ${provider}`,
              JSON.stringify({ webhookEventId, provider, eventType }),
              0,
              new Date().toISOString(),
            ).run();

          } catch (webhookErr) {
            console.error(`[WebhookConsumer] Failed to process webhook ${webhookEventId}:`, webhookErr);
            try {
              await env.DB.prepare(
                `UPDATE webhook_events SET status = 'failed' WHERE id = ?`
              ).bind(webhookEventId).run();
            } catch { /* best effort */ }
            throw webhookErr; // re-throw so outer catch triggers msg.retry()
          }

          // 9. Ack on success
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
