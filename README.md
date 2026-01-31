# Clawpass

**ERC-8004 Interface Module for AI Agents on Blockchain**

Clawpass is a modular TypeScript/JavaScript library that provides a complete interface to the ERC-8004 Trustless Agents protocol. It enables AI agents to establish decentralized identity, accumulate verifiable reputation, and validate their work through blockchain-based registries.

**Built as an add-on module for easy consumption by moltbook, moltx.io, OpenClaw, and other applications.**

## Features

- **Identity Registry**: Register and manage AI agent identities on-chain
- **Reputation Registry**: Collect and query verifiable peer feedback
- **Validation Registry**: Request and track independent validation of agent work
- **Modular Design**: Use as a complete solution or integrate individual components
- **TypeScript Support**: Full type definitions and runtime validation with Zod
- **Framework Agnostic**: Works with any JavaScript/TypeScript project
- **OpenClaw Plugin**: Install as an [OpenClaw](https://docs.openclaw.ai/) plugin for agent tools and CLI

## Installation

```bash
npm install clawpass ethers
```

## Quick Start

For a short walkthrough, see [QUICKSTART.md](QUICKSTART.md). For a fuller introduction, see [GETTING_STARTED.md](GETTING_STARTED.md).

```typescript
import { ethers } from 'ethers';
import { ClawpassClient } from 'clawpass';

// Setup provider and signer
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// Initialize Clawpass
const clawpass = new ClawpassClient({
  identityRegistryAddress: '0x...',
  reputationRegistryAddress: '0x...',
  validationRegistryAddress: '0x...',
  providerOrSigner: signer,
});

// Register an agent
const agentId = await clawpass.identity.register('ipfs://...');

// Give feedback
await clawpass.reputation.giveFeedback({
  agentId: 1n,
  value: 45n, // 4.5 stars
  valueDecimals: 1,
  tag1: 'quality',
});

// Request validation
await clawpass.validation.validationRequest({
  validatorAddress: '0x...',
  agentId: 1,
  requestURI: 'ipfs://...',
  requestHash: '0x...',
});
```

## Core Concepts

### Identity Registry

The Identity Registry uses ERC-721 to provide each agent with a portable, censorship-resistant on-chain identifier. Each agent has:

- **Agent ID**: Unique token ID
- **Agent URI**: Points to registration file (IPFS, HTTPS, or on-chain data URI)
- **Metadata**: Optional key-value storage
- **Agent Wallet**: Verified payment address

### Reputation Registry

The Reputation Registry enables collecting and querying feedback signals from task completion:

- **Feedback Values**: Fixed-point numbers with configurable decimals (0-18)
- **Tags**: Two optional tags for categorization and filtering
- **Composable**: On-chain aggregation and off-chain sophisticated scoring
- **Sybil-Resistant**: Requires filtering by trusted client addresses

### Validation Registry

The Validation Registry provides hooks for independent validators to verify task execution:

- **Validation Requests**: Agents request verification from validators
- **Validation Responses**: Validators provide scores (0-100)
- **Progressive Validation**: Multiple responses per request (e.g., soft/hard finality)
- **Flexible**: Supports stake-secured re-execution, zkML proofs, TEE oracles

## Usage Examples

### Register an Agent

```typescript
import { createDataURI } from 'clawpass';

const registrationFile = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
  name: 'MyAIAgent',
  description: 'An AI agent that provides data analysis',
  services: [
    {
      name: 'A2A',
      endpoint: 'https://agent.example.com/.well-known/agent-card.json',
      version: '0.3.0',
    },
  ],
  x402Support: true,
  active: true,
  registrations: [],
  supportedTrust: ['reputation', 'crypto-economic'],
};

// Store on-chain as data URI
const agentURI = createDataURI(registrationFile);
const agentId = await clawpass.identity.register(agentURI);
```

### Give Feedback

```typescript
import { toFixedPoint } from 'clawpass';

await clawpass.reputation.giveFeedback({
  agentId: 1n,
  value: toFixedPoint(4.5, 1), // 4.5 with 1 decimal
  valueDecimals: 1,
  tag1: 'starred',
  tag2: 'quality',
  endpoint: 'https://agent.example.com/api',
  feedbackURI: 'ipfs://...',
});
```

### Get Agent Reputation

```typescript
// Get reputation from trusted reviewers only
const trustedClients = ['0x...', '0x...'];
const reputation = await clawpass.getAgentReputation(
  1n,
  trustedClients,
  'starred' // optional tag filter
);

console.log(`Average: ${reputation.summary.summaryValue}`);
console.log(`Count: ${reputation.summary.count}`);
```

### Request Validation

```typescript
import { calculateHash } from 'clawpass';

const requestData = JSON.stringify({
  task: 'Verify analysis',
  input: {...},
  output: {...},
});

await clawpass.validation.validationRequest({
  validatorAddress: '0x...', // Validator contract
  agentId: 1,
  requestURI: 'ipfs://...',
  requestHash: calculateHash(requestData),
});
```

### Get Validation Status

```typescript
const status = await clawpass.validation.getValidationStatus(requestHash);

console.log(`Score: ${status.response}/100`);
console.log(`Validator: ${status.validatorAddress}`);
console.log(`Last Update: ${status.lastUpdate}`);
```

## OpenClaw Plugin

Clawpass works as an [OpenClaw](https://docs.openclaw.ai/) plugin so agents can use ERC-8004 identity, reputation, and validation from within OpenClaw. See [OpenClaw plugins](https://docs.openclaw.ai/cli/plugins) and [Plugin manifest](https://docs.openclaw.ai/plugins/manifest). For plugin details and config, see [docs/OPENCLAW_PLUGIN.md](docs/OPENCLAW_PLUGIN.md).

### Install

From npm:

```bash
openclaw plugins install clawpass
```

From a local path (development; run `npm run build` in the clawpass directory first):

```bash
cd path/to/clawpass && npm run build
openclaw plugins install -l ./path/to/clawpass
```

Then enable and configure in your OpenClaw config:

```json
{
  "plugins": {
    "enabled": true,
    "entries": {
      "clawpass": {
        "enabled": true,
        "config": {
          "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
          "identityRegistryAddress": "0x...",
          "reputationRegistryAddress": "0x...",
          "validationRegistryAddress": "0x...",
          "privateKey": "0x..."
        }
      }
    }
  }
}
```

Optional: allow Clawpass tools for an agent (tools are **optional** and opt-in):

```json
{
  "agents": {
    "list": [{
      "id": "main",
      "tools": {
        "allow": ["clawpass", "clawpass_get_agent_info", "clawpass_get_reputation", "clawpass_give_feedback", "clawpass_request_validation", "clawpass_validation_status"]
      }
    }]
  }
}
```

### Plugin tools (optional)

| Tool | Description |
|------|-------------|
| `clawpass_get_agent_info` | Get agent registration, owner, wallet (params: `agentId`) |
| `clawpass_get_reputation` | Get reputation from trusted clients (params: `agentId`, `trustedClients`, optional `tag1`, `tag2`) |
| `clawpass_give_feedback` | Submit feedback (params: `agentId`, `value`, `valueDecimals`, optional `tag1`, `tag2`, `endpoint`). Requires `privateKey` in config. |
| `clawpass_request_validation` | Request validation (params: `validatorAddress`, `agentId`, `requestURI`, `requestData` or `requestHash`). Requires `privateKey`. |
| `clawpass_validation_status` | Get validation status (params: `requestHash`) |

### CLI

After installing the plugin:

```bash
openclaw clawpass
```

Prints whether Clawpass is configured and ready.

### Gateway RPC

If the gateway exposes plugin RPC:

- `clawpass.status` — returns `{ configured: boolean }`.

## Integration Examples

### Moltbook Integration

```typescript
import { MoltbookClawpassIntegration } from 'clawpass/examples/moltbook-integration';

const integration = new MoltbookClawpassIntegration(clawpass);

// Register agent
const agentId = await integration.registerAgent(moltbookAgent, '1', '0x...');

// Submit peer feedback
await integration.submitPeerFeedback(
  moltbookAgentId,
  4.5, // rating
  reviewerAddress
);

// Get trust score
const trustScore = await integration.getAgentTrustScore(
  moltbookAgentId,
  trustedPeers
);
```

### Moltx.io Integration

```typescript
import { MoltxClawpassIntegration } from 'clawpass/examples/moltx-integration';

const integration = new MoltxClawpassIntegration(clawpass);

// Get agent profile
const profile = await integration.getAgentProfile(agentId, trustedReviewers);

// Find agents by service
const a2aAgents = await integration.findAgentsByService(agentIds, 'A2A');

// Compare agents
const comparison = await integration.compareAgents(agentIds, trustedReviewers);
```

## API Reference

### ClawpassClient

Main client providing unified access to all registries.

```typescript
class ClawpassClient {
  identity: IdentityRegistryClient;
  reputation: ReputationRegistryClient;
  validation: ValidationRegistryClient;

  constructor(config: ClawpassConfig);
  verifyRegistryLinks(): Promise<boolean>;
  getAgentInfo(agentId: bigint): Promise<AgentInfo>;
  getAgentReputation(agentId: bigint, trustedClients: string[]): Promise<ReputationData>;
  getAgentValidationSummary(agentId: bigint): Promise<ValidationData>;
}
```

### IdentityRegistryClient

```typescript
class IdentityRegistryClient {
  register(agentURI?: string, metadata?: MetadataEntry[]): Promise<bigint>;
  setAgentURI(agentId: bigint, newURI: string): Promise<void>;
  getAgentURI(agentId: bigint): Promise<string>;
  getAgentRegistrationFile(agentId: bigint): Promise<AgentRegistrationFile>;
  setMetadata(agentId: bigint, key: string, value: string): Promise<void>;
  getMetadata(agentId: bigint, key: string): Promise<string>;
  getAgentWallet(agentId: bigint): Promise<string>;
  setAgentWallet(agentId: bigint, newWallet: string, deadline: bigint, signature: string): Promise<void>;
  getOwner(agentId: bigint): Promise<string>;
}
```

### ReputationRegistryClient

```typescript
class ReputationRegistryClient {
  giveFeedback(feedback: FeedbackData): Promise<void>;
  revokeFeedback(agentId: bigint, feedbackIndex: bigint): Promise<void>;
  appendResponse(agentId: bigint, clientAddress: string, feedbackIndex: bigint, responseURI: string): Promise<void>;
  getSummary(agentId: bigint, clientAddresses: string[], tag1?: string, tag2?: string): Promise<FeedbackSummary>;
  readFeedback(agentId: bigint, clientAddress: string, feedbackIndex: bigint): Promise<FeedbackRecord>;
  readAllFeedback(agentId: bigint, clientAddresses?: string[], tag1?: string, tag2?: string): Promise<FeedbackRecord[]>;
  getClients(agentId: bigint): Promise<string[]>;
}
```

### ValidationRegistryClient

```typescript
class ValidationRegistryClient {
  validationRequest(request: ValidationRequest): Promise<void>;
  validationResponse(response: ValidationResponse): Promise<void>;
  getValidationStatus(requestHash: string): Promise<ValidationStatus>;
  getSummary(agentId: bigint, validatorAddresses?: string[], tag?: string): Promise<ValidationSummary>;
  getAgentValidations(agentId: bigint): Promise<string[]>;
  getValidatorRequests(validatorAddress: string): Promise<string[]>;
}
```

## Utility Functions

```typescript
// Data URI handling
createDataURI(registrationFile: AgentRegistrationFile): string;
parseDataURI(dataURI: string): AgentRegistrationFile;

// Fixed-point conversion
toFixedPoint(value: number, decimals: number): bigint;
fromFixedPoint(value: bigint, decimals: number): number;

// Hash calculation
calculateHash(content: string): string;
verifyHash(content: string, hash: string): boolean;

// IPFS utilities
createIPFSUri(cid: string): string;
extractCIDFromIPFS(ipfsUri: string): string;
ipfsToHTTP(ipfsUri: string, gateway?: string): string;

// Metadata encoding
encodeMetadata(value: string): string;
decodeMetadata(hexValue: string): string;
```

## Architecture

Clawpass is designed as a modular add-on that can be easily consumed by different applications. For design and module structure, see [ARCHITECTURE.md](ARCHITECTURE.md). For data flow and system overview, see [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md).

```
clawpass/
├── src/
│   ├── ClawpassClient.ts         # Unified client
│   ├── clients/
│   │   ├── IdentityRegistryClient.ts
│   │   ├── ReputationRegistryClient.ts
│   │   └── ValidationRegistryClient.ts
│   ├── types/                    # TypeScript types
│   ├── schemas/                  # Zod validation schemas
│   ├── abis/                     # Contract ABIs
│   └── utils/                    # Utility functions
├── examples/
│   ├── basic-usage.ts
│   ├── moltbook-integration.ts
│   └── moltx-integration.ts
└── dist/                         # Compiled output
```

## ERC-8004 Specification

Clawpass implements the [ERC-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004) specification, which defines:

- **Identity Registry**: ERC-721 based agent registration
- **Reputation Registry**: Feedback collection and aggregation
- **Validation Registry**: Independent verification hooks

For full specification details, see [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004).

## Security Considerations

- **Sybil Attacks**: Always filter reputation queries by trusted client addresses
- **Validation Trust**: Validator incentives and slashing are protocol-specific
- **Private Keys**: Never expose private keys or commit them to version control
- **Gas Costs**: Be mindful of gas costs for on-chain operations

For production setup, monitoring, and troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Contributing

Contributions are welcome! Please follow the guidelines in [CONTRIBUTING.md](CONTRIBUTING.md):

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details

## Links

**Documentation**

- [QUICKSTART.md](QUICKSTART.md) — Short walkthrough
- [GETTING_STARTED.md](GETTING_STARTED.md) — Full introduction
- [ARCHITECTURE.md](ARCHITECTURE.md) — Design and module structure
- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) — Data flow and system overview
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production and deployment
- [docs/OPENCLAW_PLUGIN.md](docs/OPENCLAW_PLUGIN.md) — OpenClaw plugin setup and config
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) — Project overview

**External**

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [GitHub Repository](https://github.com/your-org/clawpass)
- [Documentation](https://clawpass.dev)

## Support

For questions and support:

- Open an issue on GitHub
- Join our Discord community
- Email: support@clawpass.dev
