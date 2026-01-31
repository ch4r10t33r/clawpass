/**
 * Core type definitions for ERC-8004 Trustless Agents
 */

export interface AgentRegistry {
  namespace: string; // e.g., "eip155"
  chainId: string; // e.g., "1"
  identityRegistry: string; // Contract address
}

export interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
  skills?: string[];
  domains?: string[];
}

export interface AgentRegistration {
  agentId: number;
  agentRegistry: string; // Format: "{namespace}:{chainId}:{identityRegistry}"
}

export interface AgentRegistrationFile {
  type: string; // "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"
  name: string;
  description: string;
  image?: string;
  services: AgentService[];
  x402Support: boolean;
  active: boolean;
  registrations: AgentRegistration[];
  supportedTrust?: ('reputation' | 'crypto-economic' | 'tee-attestation')[];
}

export interface MetadataEntry {
  metadataKey: string;
  metadataValue: string; // Hex-encoded bytes
}

export interface FeedbackData {
  agentId: number;
  value: bigint; // int128
  valueDecimals: number; // 0-18
  tag1?: string;
  tag2?: string;
  endpoint?: string;
  feedbackURI?: string;
  feedbackHash?: string; // bytes32 hex string
}

export interface FeedbackRecord {
  agentId: number;
  clientAddress: string;
  feedbackIndex: bigint;
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

export interface FeedbackFile {
  agentRegistry: string;
  agentId: number;
  clientAddress: string;
  createdAt: string; // ISO 8601
  value: number;
  valueDecimals: number;
  tag1?: string;
  tag2?: string;
  endpoint?: string;
  mcp?: {
    tool?: string;
    prompt?: string;
    resource?: string;
  };
  a2a?: {
    skills?: string[];
    contextId?: string;
    taskId?: string;
  };
  oasf?: {
    skills?: string[];
    domains?: string[];
  };
  proofOfPayment?: {
    fromAddress: string;
    toAddress: string;
    chainId: string;
    txHash: string;
  };
  [key: string]: unknown; // Allow additional fields
}

export interface ValidationRequest {
  validatorAddress: string;
  agentId: number;
  requestURI: string;
  requestHash: string; // bytes32 hex string
}

export interface ValidationResponse {
  requestHash: string;
  response: number; // 0-100
  responseURI?: string;
  responseHash?: string;
  tag?: string;
}

export interface ValidationStatus {
  validatorAddress: string;
  agentId: number;
  response: number;
  responseHash: string;
  tag: string;
  lastUpdate: bigint;
}

export interface ValidationSummary {
  count: bigint;
  averageResponse: number;
}

export interface FeedbackSummary {
  count: bigint;
  summaryValue: bigint;
  summaryValueDecimals: number;
}

export interface AgentIdentifier {
  agentRegistry: AgentRegistry;
  agentId: number;
}

export function formatAgentRegistry(registry: AgentRegistry): string {
  return `${registry.namespace}:${registry.chainId}:${registry.identityRegistry}`;
}

export function parseAgentRegistry(registryString: string): AgentRegistry {
  const parts = registryString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid agent registry format. Expected: namespace:chainId:identityRegistry');
  }
  return {
    namespace: parts[0],
    chainId: parts[1],
    identityRegistry: parts[2],
  };
}
