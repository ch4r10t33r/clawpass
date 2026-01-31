/**
 * Clawpass - ERC-8004 Interface Module
 * 
 * A modular TypeScript/JavaScript library for interacting with ERC-8004 Trustless Agents protocol.
 * Provides identity, reputation, and validation registry clients for AI agents on blockchain.
 */

// Main client
export { ClawpassClient, ClawpassConfig } from './ClawpassClient';

// Individual registry clients
export { IdentityRegistryClient } from './clients/IdentityRegistryClient';
export { ReputationRegistryClient } from './clients/ReputationRegistryClient';
export { ValidationRegistryClient } from './clients/ValidationRegistryClient';

// Types
export * from './types';

// Schemas
export * from './schemas';

// Utilities
export * from './utils';

// ABIs
export { default as IdentityRegistryABI } from './abis/IdentityRegistry.json';
export { default as ReputationRegistryABI } from './abis/ReputationRegistry.json';
export { default as ValidationRegistryABI } from './abis/ValidationRegistry.json';
