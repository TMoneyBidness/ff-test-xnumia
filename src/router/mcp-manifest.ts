import { Hono } from 'hono'
import type { Env } from '../lib/env'

const mcpManifest = new Hono<{ Bindings: Env }>()

mcpManifest.get('/mcp/manifest', (c) => {
  return c.json({
    name: 'payment-pipeline',
    version: '0.1.0',
    description: 'Payment request processing pipeline with autonomous agent evaluation',
    tools: [
      {
        name: 'submit_payment',
        description: 'Submit a payment request for agent evaluation through the full pipeline (intake, compliance, FX, risk, reconciliation)',
        endpoint: 'POST /mcp/submit-payment',
        parameters: {
          type: 'object',
          required: ['clientId', 'clientName', 'amountCents', 'currencyFrom', 'currencyTo'],
          properties: {
            clientId: { type: 'string', description: 'Unique identifier for the client' },
            clientName: { type: 'string', description: 'Display name of the client' },
            amountCents: { type: 'integer', description: 'Payment amount in cents (e.g. 15000 = $150.00)' },
            currencyFrom: { type: 'string', description: 'Source currency code (e.g. USD, EUR, GBP)' },
            currencyTo: { type: 'string', description: 'Target currency code (e.g. USDC, EUR, GBP)' },
            description: { type: 'string', description: 'Optional description of the payment' },
          },
        },
      },
      {
        name: 'pipeline_status',
        description: 'Get the current status of a payment request with all agent decisions and verdicts',
        endpoint: 'GET /mcp/pipeline-status/:requestId',
        parameters: {
          type: 'object',
          required: ['requestId'],
          properties: {
            requestId: { type: 'string', description: 'UUID of the payment request' },
          },
        },
      },
      {
        name: 'list_escalated',
        description: 'List all payment requests that have been escalated for human review, with their agent decisions',
        endpoint: 'GET /mcp/escalated',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'approve_payment',
        description: 'Approve an escalated payment request after human review',
        endpoint: 'POST /mcp/approve/:requestId',
        parameters: {
          type: 'object',
          required: ['requestId', 'approvedBy'],
          properties: {
            requestId: { type: 'string', description: 'UUID of the payment request to approve' },
            approvedBy: { type: 'string', description: 'Identifier of the person approving' },
            reason: { type: 'string', description: 'Optional reason for approval' },
          },
        },
      },
      {
        name: 'reject_payment',
        description: 'Reject an escalated payment request after human review',
        endpoint: 'POST /mcp/reject/:requestId',
        parameters: {
          type: 'object',
          required: ['requestId', 'rejectedBy', 'reason'],
          properties: {
            requestId: { type: 'string', description: 'UUID of the payment request to reject' },
            rejectedBy: { type: 'string', description: 'Identifier of the person rejecting' },
            reason: { type: 'string', description: 'Reason for rejection (required)' },
          },
        },
      },
      {
        name: 'ask_why',
        description: 'Get the detailed reasoning and data behind a specific agent\'s decision on a payment request',
        endpoint: 'GET /mcp/ask-why/:requestId/:agentType',
        parameters: {
          type: 'object',
          required: ['requestId', 'agentType'],
          properties: {
            requestId: { type: 'string', description: 'UUID of the payment request' },
            agentType: {
              type: 'string',
              enum: ['validate', 'quote', 'screen', 'execute', 'reconcile'],
              description: 'The pipeline agent whose reasoning you want to inspect',
            },
          },
        },
      },
      {
        name: 'activity_feed',
        description: 'Get the most recent agent decisions across all payment requests',
        endpoint: 'GET /mcp/activity',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'integer', description: 'Number of decisions to return (default 20, max 100)' },
          },
        },
      },
    ],
  })
})

export { mcpManifest }
