# Clawpass Architecture

This document describes the architecture and design decisions of the Clawpass library.

## Overview

Clawpass is designed as a modular, type-safe TypeScript library that provides a complete interface to the ERC-8004 Trustless Agents protocol. The architecture prioritizes:

1. **Modularity**: Each registry can be used independently
2. **Type Safety**: Full TypeScript support with runtime validation
3. **Ease of Integration**: Simple APIs for common use cases
4. **Extensibility**: Easy to extend for custom use cases

## Module Structure

```
clawpass/
├── src/
│   ├── ClawpassClient.ts              # Unified client
│   ├── clients/                       # Registry-specific clients
│   │   ├── IdentityRegistryClient.ts
│   │   ├── ReputationRegistryClient.ts
│   │   └── ValidationRegistryClient.ts
│   ├── types/                         # TypeScript type definitions
│   │   └── index.ts
│   ├── schemas/                       # Zod validation schemas
│   │   └── index.ts
│   ├── abis/                          # Contract ABIs
│   │   ├── IdentityRegistry.json
│   │   ├── ReputationRegistry.json
│   │   └── ValidationRegistry.json
│   └── utils/                         # Utility functions
│       └── index.ts
├── examples/                          # Integration examples
│   ├── basic-usage.ts
│   ├── moltbook-integration.ts
│   └── moltx-integration.ts
└── dist/                              # Compiled output (CJS + ESM)
```

## Core Components

### 1. ClawpassClient

The main entry point that provides unified access to all three registries.

**Design Decisions:**
- Accepts a single configuration object for all three registry addresses
- Exposes individual registry clients as public properties
- Provides convenience methods for common multi-registry operations
- Verifies registry linkage to ensure consistency

**Usage Pattern:**
```typescript
const clawpass = new ClawpassClient(config);
await clawpass.identity.register(...);
await clawpass.reputation.giveFeedback(...);
```

### 2. Registry Clients

Each registry has its own client class that encapsulates all interactions with that specific contract.

**IdentityRegistryClient:**
- Agent registration and management
- URI handling (IPFS, HTTPS, data URIs)
- Metadata operations
- Agent wallet management with EIP-712 signatures

**ReputationRegistryClient:**
- Feedback submission and revocation
- Response appending
- Feedback querying with filters
- Summary aggregation
- Sybil attack prevention through required client filtering

**ValidationRegistryClient:**
- Validation request submission
- Validation response handling
- Status queries
- Summary aggregation

**Design Decisions:**
- Each client can be used independently
- Read-only operations don't require a signer
- Write operations validate signer presence
- All async operations return promises
- Type-safe parameters with TypeScript

### 3. Type System

**Types (`src/types/index.ts`):**
- Core data structures matching ERC-8004 spec
- Helper types for common operations
- Utility functions for type conversion

**Schemas (`src/schemas/index.ts`):**
- Zod schemas for runtime validation
- Ensures data integrity when parsing external data
- Validates registration files and feedback files

**Design Decisions:**
- Types are defined separately from schemas for flexibility
- Schemas are used for parsing external data (URIs, user input)
- Types provide compile-time safety
- Schemas provide runtime safety

### 4. Utilities

Common utility functions for:
- Data URI encoding/decoding
- Fixed-point number conversion
- Hash calculation and verification
- IPFS URI handling
- Metadata encoding/decoding
- Agent registry string formatting

**Design Decisions:**
- Pure functions with no side effects
- Well-tested with comprehensive unit tests
- Exported for use in consuming applications

## Data Flow

### Agent Registration Flow

```
User → ClawpassClient → IdentityRegistryClient → Contract
                                ↓
                        Registration File (IPFS/HTTPS/Data URI)
                                ↓
                        AgentRegistrationFileSchema (validation)
```

### Feedback Flow

```
User → ClawpassClient → ReputationRegistryClient → Contract
                                ↓
                        Feedback File (optional, IPFS)
                                ↓
                        FeedbackFileSchema (validation)
```

### Validation Flow

```
Agent → ValidationRegistryClient → Contract → Validator
                                                  ↓
                                        Validation Response
                                                  ↓
                                        ValidationRegistryClient
```

## Integration Patterns

### Pattern 1: Direct Usage

Applications can use Clawpass directly for ERC-8004 operations:

```typescript
import { ClawpassClient } from 'clawpass';
const clawpass = new ClawpassClient(config);
await clawpass.identity.register(...);
```

### Pattern 2: Wrapper Integration

Applications can create wrapper classes that combine Clawpass with application-specific logic:

```typescript
class MoltbookClawpassIntegration {
  private clawpass: ClawpassClient;
  
  async registerAgent(moltbookAgent) {
    // Convert moltbook format to ERC-8004 format
    // Use clawpass for blockchain operations
  }
}
```

### Pattern 3: Modular Usage

Applications can use individual registry clients without the unified client:

```typescript
import { IdentityRegistryClient } from 'clawpass';
const identity = new IdentityRegistryClient(address, provider);
```

## Security Considerations

### 1. Signer Management

- Clients accept either Provider (read-only) or Signer (read-write)
- Write operations check for signer presence
- Private keys never stored or logged

### 2. Input Validation

- All external data validated with Zod schemas
- Type guards for runtime type checking
- Parameter validation in all public methods

### 3. Sybil Attack Prevention

- Reputation queries require trusted client addresses
- Documentation emphasizes importance of filtering
- No default "all clients" queries

### 4. Hash Verification

- Utilities provided for hash calculation
- IPFS URIs don't require separate hash (content-addressed)
- Non-IPFS URIs should include hash for integrity

## Testing Strategy

### Unit Tests

- Utility functions (100% coverage target)
- Schema validation
- Type conversions
- Hash functions

### Integration Tests

- Mock contract interactions
- End-to-end flows
- Error handling

### Example Tests

- Integration examples as tests
- Verify examples stay up-to-date

## Build and Distribution

### Build Process

1. TypeScript compilation
2. Dual output: CommonJS and ESM
3. Type declarations generation
4. Source maps for debugging

### Distribution

- npm package with both CJS and ESM
- Type declarations included
- Tree-shakeable ESM modules
- Peer dependency on ethers v6

## Future Enhancements

### Planned Features

1. **Event Listening**: Subscribe to registry events
2. **Batch Operations**: Submit multiple operations in one transaction
3. **Caching Layer**: Cache frequently accessed data
4. **Subgraph Integration**: Query historical data efficiently
5. **Multi-chain Support**: Simplified multi-chain agent management

### Extension Points

1. **Custom Validators**: Interface for custom validation logic
2. **Reputation Algorithms**: Pluggable reputation scoring
3. **Storage Backends**: Support for additional storage (Arweave, etc.)
4. **Authentication**: Integration with wallet connection libraries

## Performance Considerations

### Optimization Strategies

1. **Parallel Queries**: Use Promise.all for independent operations
2. **Selective Fetching**: Only fetch needed data
3. **Caching**: Cache immutable data (agent URIs, etc.)
4. **Batch Reads**: Combine multiple read operations

### Gas Optimization

1. **Data URIs**: Store small registration files on-chain
2. **IPFS**: Use for larger files
3. **Minimal Metadata**: Only store essential on-chain data
4. **Event Indexing**: Use events for historical data

## Compatibility

### Supported Environments

- Node.js 18+
- Modern browsers (ES2020+)
- TypeScript 5.0+
- Ethers.js v6

### Blockchain Compatibility

- Any EVM-compatible chain
- Mainnet, L2s, testnets
- Custom networks with deployed contracts

## Contributing

See CONTRIBUTING.md for:
- Code style guidelines
- Testing requirements
- PR process
- Release workflow
