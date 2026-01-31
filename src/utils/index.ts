/**
 * Utility functions for Clawpass
 */

import { ethers } from 'ethers';
import { AgentRegistrationFile, FeedbackFile } from '../types';

/**
 * Create a base64-encoded data URI for on-chain agent registration
 */
export function createDataURI(registrationFile: AgentRegistrationFile): string {
  const json = JSON.stringify(registrationFile);
  const base64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${base64}`;
}

/**
 * Parse a data URI to extract the registration file
 */
export function parseDataURI(dataURI: string): AgentRegistrationFile {
  if (!dataURI.startsWith('data:application/json;base64,')) {
    throw new Error('Invalid data URI format');
  }

  const base64Data = dataURI.split(',')[1];
  const json = Buffer.from(base64Data, 'base64').toString('utf-8');
  return JSON.parse(json);
}

/**
 * Convert a number to fixed-point representation for feedback values
 */
export function toFixedPoint(value: number, decimals: number): bigint {
  if (decimals < 0 || decimals > 18) {
    throw new Error('Decimals must be between 0 and 18');
  }

  const multiplier = 10 ** decimals;
  return BigInt(Math.round(value * multiplier));
}

/**
 * Convert fixed-point representation back to number
 */
export function fromFixedPoint(value: bigint, decimals: number): number {
  if (decimals < 0 || decimals > 18) {
    throw new Error('Decimals must be between 0 and 18');
  }

  const divisor = 10 ** decimals;
  return Number(value) / divisor;
}

/**
 * Create a feedback file object
 */
export function createFeedbackFile(
  agentRegistry: string,
  agentId: number,
  clientAddress: string,
  value: number,
  valueDecimals: number,
  options?: {
    tag1?: string;
    tag2?: string;
    endpoint?: string;
    mcp?: FeedbackFile['mcp'];
    a2a?: FeedbackFile['a2a'];
    oasf?: FeedbackFile['oasf'];
    proofOfPayment?: FeedbackFile['proofOfPayment'];
    [key: string]: unknown;
  }
): FeedbackFile {
  return {
    agentRegistry,
    agentId,
    clientAddress,
    createdAt: new Date().toISOString(),
    value,
    valueDecimals,
    ...options,
  };
}

/**
 * Calculate keccak256 hash of content
 */
export function calculateHash(content: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(content));
}

/**
 * Verify hash matches content
 */
export function verifyHash(content: string, hash: string): boolean {
  return calculateHash(content) === hash;
}

/**
 * Format agent registry string
 */
export function formatAgentRegistryString(
  namespace: string,
  chainId: string,
  identityRegistry: string
): string {
  return `${namespace}:${chainId}:${identityRegistry}`;
}

/**
 * Parse agent registry string
 */
export function parseAgentRegistryString(registryString: string): {
  namespace: string;
  chainId: string;
  identityRegistry: string;
} {
  const parts = registryString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid agent registry format');
  }

  return {
    namespace: parts[0],
    chainId: parts[1],
    identityRegistry: parts[2],
  };
}

/**
 * Create IPFS URI from CID
 */
export function createIPFSUri(cid: string): string {
  return `ipfs://${cid}`;
}

/**
 * Extract CID from IPFS URI
 */
export function extractCIDFromIPFS(ipfsUri: string): string {
  if (!ipfsUri.startsWith('ipfs://')) {
    throw new Error('Invalid IPFS URI');
  }
  return ipfsUri.replace('ipfs://', '');
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHTTP(ipfsUri: string, gateway: string = 'https://ipfs.io'): string {
  const cid = extractCIDFromIPFS(ipfsUri);
  return `${gateway}/ipfs/${cid}`;
}

/**
 * Calculate average from feedback values
 */
export function calculateAverageFeedback(
  feedbackValues: Array<{ value: bigint; decimals: number }>
): number {
  if (feedbackValues.length === 0) return 0;

  const total = feedbackValues.reduce((sum, fb) => {
    return sum + fromFixedPoint(fb.value, fb.decimals);
  }, 0);

  return total / feedbackValues.length;
}

/**
 * Encode metadata value to bytes (hex string)
 */
export function encodeMetadata(value: string): string {
  return ethers.hexlify(ethers.toUtf8Bytes(value));
}

/**
 * Decode metadata value from bytes (hex string)
 */
export function decodeMetadata(hexValue: string): string {
  return ethers.toUtf8String(hexValue);
}
