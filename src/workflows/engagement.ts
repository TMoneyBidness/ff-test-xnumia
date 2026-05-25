import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import type { Env } from '../lib/env';

type EngagementParams = { engagementId: string; tenantId: string };

export class EngagementWorkflow extends WorkflowEntrypoint<Env, EngagementParams> {
  async run(event: WorkflowEvent<EngagementParams>, step: WorkflowStep) {
    const { engagementId, tenantId } = event.payload;

    const initResult = await step.do('init-engagement', async () => {
      console.log(`Initializing engagement ${engagementId} for tenant ${tenantId}`);
      return { id: engagementId, status: 'INITIATED' as const, ts: Date.now() };
    });

    const approval = await step.waitForEvent<{ approved: boolean }>(
      'human-approval',
      { type: 'approval-decision', timeout: '7 days' },
    );

    const approved = (approval as unknown as { approved: boolean }).approved

    const executeResult = await step.do('execute-engagement', async () => {
      if (approved) {
        console.log(`Engagement ${engagementId} approved — executing`);
        return { status: 'EXECUTED' as const };
      }

      console.log(`Engagement ${engagementId} rejected`);
      return { status: 'REJECTED' as const };
    });

    return executeResult;
  }
}
