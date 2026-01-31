/**
 * Zod schemas for runtime validation of ERC-8004 data structures
 */

import { z } from 'zod';

export const AgentServiceSchema = z.object({
  name: z.string(),
  endpoint: z.string(),
  version: z.string().optional(),
  skills: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
});

export const AgentRegistrationSchema = z.object({
  agentId: z.number(),
  agentRegistry: z.string().regex(/^[^:]+:[^:]+:0x[a-fA-F0-9]{40}$/),
});

export const AgentRegistrationFileSchema = z.object({
  type: z.literal('https://eips.ethereum.org/EIPS/eip-8004#registration-v1'),
  name: z.string(),
  description: z.string(),
  image: z.string().optional(),
  services: z.array(AgentServiceSchema),
  x402Support: z.boolean(),
  active: z.boolean(),
  registrations: z.array(AgentRegistrationSchema),
  supportedTrust: z
    .array(z.enum(['reputation', 'crypto-economic', 'tee-attestation']))
    .optional(),
});

export const FeedbackFileSchema = z.object({
  agentRegistry: z.string(),
  agentId: z.number(),
  clientAddress: z.string(),
  createdAt: z.string(),
  value: z.number(),
  valueDecimals: z.number().min(0).max(18),
  tag1: z.string().optional(),
  tag2: z.string().optional(),
  endpoint: z.string().optional(),
  mcp: z
    .object({
      tool: z.string().optional(),
      prompt: z.string().optional(),
      resource: z.string().optional(),
    })
    .optional(),
  a2a: z
    .object({
      skills: z.array(z.string()).optional(),
      contextId: z.string().optional(),
      taskId: z.string().optional(),
    })
    .optional(),
  oasf: z
    .object({
      skills: z.array(z.string()).optional(),
      domains: z.array(z.string()).optional(),
    })
    .optional(),
  proofOfPayment: z
    .object({
      fromAddress: z.string(),
      toAddress: z.string(),
      chainId: z.string(),
      txHash: z.string(),
    })
    .optional(),
});

export type ValidatedAgentRegistrationFile = z.infer<typeof AgentRegistrationFileSchema>;
export type ValidatedFeedbackFile = z.infer<typeof FeedbackFileSchema>;
