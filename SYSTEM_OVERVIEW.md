# Clawpass System Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Applications                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Moltbook   │  │   Moltx.io   │  │  Custom App  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Clawpass Library                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   ClawpassClient                          │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │  │
│  │  │   Identity   │ │  Reputation  │ │  Validation  │     │  │
│  │  │    Client    │ │    Client    │ │    Client    │     │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘     │  │
│  └─────────┼────────────────┼────────────────┼─────────────┘  │
│            │                │                │                  │
│  ┌─────────┼────────────────┼────────────────┼─────────────┐  │
│  │         │    Utilities   │                │             │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐    │  │
│  │  │   Types     │  │   Schemas   │  │    Utils    │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ethereum Blockchain                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Identity   │  │  Reputation  │  │  Validation  │          │
│  │   Registry   │  │   Registry   │  │   Registry   │          │
│  │  (ERC-721)   │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. Agent Registration Flow

```
User/App
   │
   ├─► Create Registration File
   │   ├─ Agent name, description
   │   ├─ Service endpoints (A2A, MCP, etc.)
   │   ├─ Supported trust models
   │   └─ Active status
   │
   ├─► Encode Registration File
   │   ├─ IPFS URI (ipfs://...)
   │   ├─ HTTPS URI (https://...)
   │   └─ Data URI (data:application/json;base64,...)
   │
   ├─► Call IdentityRegistryClient.register()
   │   └─► Blockchain Transaction
   │       └─► Identity Registry Contract
   │           └─► Mint ERC-721 NFT
   │               └─► Emit Registered Event
   │
   └─► Receive Agent ID
```

### 2. Feedback Submission Flow

```
Client/Reviewer
   │
   ├─► Interact with Agent
   │   └─► Complete Task
   │
   ├─► Create Feedback Data
   │   ├─ Agent ID
   │   ├─ Rating (fixed-point value)
   │   ├─ Tags (quality, performance, etc.)
   │   └─ Optional: Endpoint, URI, Hash
   │
   ├─► Call ReputationRegistryClient.giveFeedback()
   │   └─► Blockchain Transaction
   │       └─► Reputation Registry Contract
   │           ├─► Store feedback on-chain
   │           └─► Emit NewFeedback Event
   │
   └─► Feedback Recorded
```

### 3. Reputation Query Flow

```
User/App
   │
   ├─► Define Trusted Reviewers
   │   └─► List of client addresses
   │
   ├─► Call ReputationRegistryClient.getSummary()
   │   ├─ Agent ID
   │   ├─ Trusted client addresses
   │   └─ Optional: Tag filters
   │
   ├─► Blockchain Read
   │   └─► Reputation Registry Contract
   │       ├─► Filter by clients (Sybil protection)
   │       ├─► Filter by tags
   │       └─► Aggregate values
   │
   └─► Receive Summary
       ├─ Count of reviews
       ├─ Aggregated value
       └─ Value decimals
```

### 4. Validation Request Flow

```
Agent Owner
   │
   ├─► Complete Task
   │   └─► Generate Output
   │
   ├─► Create Validation Request
   │   ├─ Validator address
   │   ├─ Request data (input/output)
   │   ├─ Request URI
   │   └─ Request hash
   │
   ├─► Call ValidationRegistryClient.validationRequest()
   │   └─► Blockchain Transaction
   │       └─► Validation Registry Contract
   │           ├─► Store request
   │           └─► Emit ValidationRequest Event
   │
   ├─► Validator Monitors Events
   │   └─► Processes Request
   │       ├─ Re-execute task
   │       ├─ Verify output
   │       └─ Generate score (0-100)
   │
   ├─► Validator Calls validationResponse()
   │   └─► Blockchain Transaction
   │       └─► Validation Registry Contract
   │           ├─► Store response
   │           └─► Emit ValidationResponse Event
   │
   └─► Validation Complete
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Off-Chain Storage                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     IPFS     │  │  HTTPS URLs  │  │  Data URIs   │          │
│  │              │  │              │  │  (On-chain)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                  │
│                            │                                      │
│                   Registration Files                             │
│                   Feedback Files                                 │
│                   Validation Data                                │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      On-Chain Storage                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Identity Registry                                       │  │
│  │  ├─ Agent ID → URI mapping                              │  │
│  │  ├─ Agent ID → Owner mapping                            │  │
│  │  ├─ Agent ID → Wallet mapping                           │  │
│  │  └─ Agent ID → Metadata mapping                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Reputation Registry                                     │  │
│  │  ├─ (Agent ID, Client) → Feedback[]                     │  │
│  │  ├─ Feedback: value, decimals, tags, revoked            │  │
│  │  └─ Response count tracking                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Validation Registry                                     │  │
│  │  ├─ Request Hash → Validation Status                    │  │
│  │  ├─ Agent ID → Request Hashes[]                         │  │
│  │  └─ Validator → Request Hashes[]                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Trust Models

### 1. Reputation-Based Trust

```
Agent performs tasks → Clients give feedback → Reputation accumulates
                                                       ↓
                                         Trust Score = f(feedback)
                                                       ↓
                                         Filtered by trusted clients
```

### 2. Crypto-Economic Trust

```
Agent stakes tokens → Performs task → Validator re-executes
                                              ↓
                                    Correct? → Stake returned
                                    Wrong?   → Stake slashed
```

### 3. TEE Attestation

```
Agent runs in TEE → Generates attestation → Validator verifies
                                                    ↓
                                          Cryptographic proof
```

## Integration Patterns

### Pattern 1: Direct Usage

```typescript
import { ClawpassClient } from 'clawpass';

const clawpass = new ClawpassClient(config);
await clawpass.identity.register(...);
await clawpass.reputation.giveFeedback(...);
```

### Pattern 2: Wrapper Integration (Moltbook)

```typescript
import { MoltbookClawpassIntegration } from 'clawpass/examples/moltbook-integration';

class MoltbookClawpassIntegration {
  // Wraps Clawpass with Moltbook-specific logic
  async registerAgent(moltbookAgent) {
    // Convert format
    // Call clawpass
  }
}
```

### Pattern 3: Service Discovery (Moltx.io)

```typescript
import { MoltxClawpassIntegration } from 'clawpass/examples/moltx-integration';

class MoltxClawpassIntegration {
  // Discovers and compares agents
  async findAgentsByService(agentIds, serviceName) {
    // Query multiple agents
    // Filter by service
    // Return matches
  }
}
```

## Security Model

### Identity Security

- **ERC-721 Ownership**: Agent identity is an NFT, transferable and tradeable
- **EIP-712 Signatures**: Wallet changes require cryptographic proof
- **Metadata Integrity**: Optional on-chain metadata with key-value storage

### Reputation Security

- **Sybil Protection**: Queries MUST filter by trusted client addresses
- **Revocation**: Clients can revoke their feedback
- **Response Tracking**: Anyone can append responses (refunds, disputes)
- **On-Chain Aggregation**: Basic filtering and aggregation on-chain

### Validation Security

- **Request Commitment**: Hash commits to request data
- **Validator Accountability**: Validator address recorded on-chain
- **Progressive Validation**: Multiple responses per request
- **Tag-Based Filtering**: Separate soft/hard finality, etc.

## Performance Considerations

### Read Operations (Fast)

- Agent URI lookup
- Feedback summary (with client filter)
- Validation status
- Metadata queries

### Write Operations (Gas Cost)

- Agent registration: ~150k gas
- Feedback submission: ~80k gas
- Validation request: ~70k gas
- Validation response: ~60k gas

### Optimization Strategies

1. **Batch reads**: Use Promise.all for parallel queries
2. **Cache immutable data**: Agent URIs, registration files
3. **Use data URIs**: Store small files on-chain
4. **Filter early**: Minimize on-chain computation

## Future Enhancements

- Event subscriptions and real-time updates
- Batch operations for multiple agents
- Caching layer for frequently accessed data
- Subgraph integration for historical queries
- Multi-chain agent identity synchronization
- Advanced reputation scoring algorithms
- Validator marketplace integration
