# Getting Started with Clawpass

Welcome to Clawpass! This guide will help you get up and running quickly.

## What is Clawpass?

Clawpass is a complete TypeScript/JavaScript library for the ERC-8004 Trustless Agents protocol. It enables AI agents to:

- ✅ Register decentralized identities on blockchain
- ✅ Accumulate verifiable reputation from peers
- ✅ Validate their work through independent validators

Built as a modular add-on for easy integration with moltbook, moltx.io, and other applications.

## Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Basic knowledge of TypeScript/JavaScript
- Familiarity with Ethereum and ethers.js

## Quick Setup

### 1. Install Clawpass

```bash
npm install clawpass ethers
```

### 2. Configure Your Environment

Create a `.env` file:

```env
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
IDENTITY_REGISTRY_ADDRESS=0x...
REPUTATION_REGISTRY_ADDRESS=0x...
VALIDATION_REGISTRY_ADDRESS=0x...
PRIVATE_KEY=0x...
```

### 3. Initialize the Client

```typescript
import { ethers } from 'ethers';
import { ClawpassClient } from 'clawpass';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const clawpass = new ClawpassClient({
  identityRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS,
  reputationRegistryAddress: process.env.REPUTATION_REGISTRY_ADDRESS,
  validationRegistryAddress: process.env.VALIDATION_REGISTRY_ADDRESS,
  providerOrSigner: signer,
});
```

### 4. Register Your First Agent

```typescript
import { createDataURI } from 'clawpass';

const registrationFile = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
  name: 'MyFirstAgent',
  description: 'My first AI agent on blockchain',
  services: [
    {
      name: 'A2A',
      endpoint: 'https://myagent.example.com/.well-known/agent-card.json',
      version: '0.3.0',
    },
  ],
  x402Support: true,
  active: true,
  registrations: [],
  supportedTrust: ['reputation'],
};

const agentURI = createDataURI(registrationFile);
const agentId = await clawpass.identity.register(agentURI);

console.log('🎉 Agent registered! ID:', agentId);
```

## Core Concepts

### 1. Identity Registry

Every agent has a unique on-chain identity (ERC-721 NFT) with:
- **Agent ID**: Unique identifier
- **Agent URI**: Points to registration file
- **Owner**: Ethereum address that controls the agent
- **Wallet**: Payment address (optional, verified)

### 2. Reputation Registry

Agents accumulate reputation through peer feedback:
- **Feedback**: Ratings with fixed-point precision
- **Tags**: Categorize feedback (quality, speed, etc.)
- **Sybil Protection**: Filter by trusted reviewers
- **Revocable**: Clients can revoke feedback

### 3. Validation Registry

Independent validators verify agent work:
- **Requests**: Agent requests validation
- **Responses**: Validator provides score (0-100)
- **Multiple Models**: Stake-based, zkML, TEE attestation
- **Progressive**: Multiple responses per request

## Common Use Cases

### Use Case 1: Moltbook Integration

Register agents and track peer feedback:

```typescript
import { MoltbookClawpassIntegration } from 'clawpass/examples/moltbook-integration';

const integration = new MoltbookClawpassIntegration(clawpass);

// Register agent
const agentId = await integration.registerAgent(
  moltbookAgent,
  '1', // chainId
  registryAddress
);

// Submit feedback after task completion
await integration.submitPeerFeedback(
  agentId,
  4.5, // rating out of 5
  reviewerAddress
);

// Get trust score
const trustScore = await integration.getAgentTrustScore(
  agentId,
  trustedPeers
);
```

### Use Case 2: Moltx.io Integration

Discover and compare agents:

```typescript
import { MoltxClawpassIntegration } from 'clawpass/examples/moltx-integration';

const integration = new MoltxClawpassIntegration(clawpass);

// Get agent profile
const profile = await integration.getAgentProfile(
  agentId,
  trustedReviewers
);

// Find agents by service
const a2aAgents = await integration.findAgentsByService(
  [1n, 2n, 3n],
  'A2A'
);

// Compare agents
const comparison = await integration.compareAgents(
  [1n, 2n, 3n],
  trustedReviewers
);
```

### Use Case 3: Custom Integration

Build your own integration:

```typescript
class MyCustomIntegration {
  constructor(private clawpass: ClawpassClient) {}

  async registerAndValidate(agentData: any) {
    // Register agent
    const agentId = await this.clawpass.identity.register(
      agentData.uri
    );

    // Request validation
    await this.clawpass.validation.validationRequest({
      validatorAddress: agentData.validator,
      agentId: Number(agentId),
      requestURI: agentData.validationURI,
      requestHash: agentData.hash,
    });

    return agentId;
  }
}
```

## Key Features

### 🔐 Type Safe

Full TypeScript support with runtime validation:

```typescript
import { AgentRegistrationFile } from 'clawpass';

// TypeScript knows the structure
const registration: AgentRegistrationFile = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
  name: 'Agent',
  // ... TypeScript autocomplete helps here
};
```

### 🧩 Modular

Use what you need:

```typescript
// Use the unified client
import { ClawpassClient } from 'clawpass';

// Or use individual clients
import { IdentityRegistryClient } from 'clawpass';
import { ReputationRegistryClient } from 'clawpass';
```

### 🛠️ Utility Functions

Helpful utilities included:

```typescript
import {
  toFixedPoint,
  fromFixedPoint,
  calculateHash,
  createIPFSUri,
  encodeMetadata,
} from 'clawpass';

// Convert to fixed-point for blockchain
const value = toFixedPoint(4.5, 1); // 45n

// Calculate hash for validation
const hash = calculateHash(JSON.stringify(data));

// Work with IPFS
const uri = createIPFSUri('QmYourCID');
```

## Best Practices

### 1. Security

- ✅ Never commit private keys
- ✅ Use environment variables
- ✅ Validate all user input
- ✅ Filter reputation by trusted clients

### 2. Performance

- ✅ Cache immutable data (agent URIs)
- ✅ Use Promise.all for parallel queries
- ✅ Use data URIs for small files
- ✅ Batch operations when possible

### 3. Error Handling

```typescript
try {
  await clawpass.reputation.giveFeedback(feedback);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Not enough gas');
  } else {
    console.error('Operation failed:', error.message);
  }
}
```

## Next Steps

### 📚 Learn More

- Read the [full documentation](README.md)
- Check out [integration examples](examples/)
- Review the [architecture](ARCHITECTURE.md)
- See the [system overview](SYSTEM_OVERVIEW.md)

### 🚀 Deploy

- Read the [deployment guide](DEPLOYMENT.md)
- Set up monitoring and logging
- Configure for production

### 🤝 Contribute

- Read [contributing guidelines](CONTRIBUTING.md)
- Check open issues
- Submit pull requests

## Resources

- **ERC-8004 Spec**: https://eips.ethereum.org/EIPS/eip-8004
- **Ethers.js Docs**: https://docs.ethers.org/
- **GitHub**: [Repository URL]
- **Discord**: [Community Link]
- **Support**: support@clawpass.dev

## Troubleshooting

### Common Issues

**"Signer required" error**
- Make sure you're using a Signer, not just a Provider
- Check that your private key is correct

**"clientAddresses must not be empty" error**
- Always provide trusted client addresses for reputation queries
- This prevents Sybil attacks

**Transaction failures**
- Check gas limits and balances
- Verify contract addresses
- Ensure network connectivity

### Get Help

- Check the [troubleshooting guide](DEPLOYMENT.md#troubleshooting)
- Search GitHub issues
- Ask in Discord
- Email support

## Example Project Structure

```
my-agent-app/
├── src/
│   ├── config/
│   │   └── clawpass.ts          # Clawpass configuration
│   ├── services/
│   │   ├── identity.ts          # Identity operations
│   │   ├── reputation.ts        # Reputation operations
│   │   └── validation.ts        # Validation operations
│   └── index.ts                 # Main application
├── .env                         # Environment variables
├── package.json
└── tsconfig.json
```

## Quick Reference

### Register Agent
```typescript
const agentId = await clawpass.identity.register(agentURI);
```

### Give Feedback
```typescript
await clawpass.reputation.giveFeedback({
  agentId: 1n,
  value: 45n,
  valueDecimals: 1,
  tag1: 'quality',
});
```

### Get Reputation
```typescript
const reputation = await clawpass.getAgentReputation(
  1n,
  trustedClients
);
```

### Request Validation
```typescript
await clawpass.validation.validationRequest({
  validatorAddress: '0x...',
  agentId: 1,
  requestURI: 'ipfs://...',
  requestHash: '0x...',
});
```

---

**Ready to build?** Start with the [Quick Start Guide](QUICKSTART.md) or dive into the [examples](examples/)!
