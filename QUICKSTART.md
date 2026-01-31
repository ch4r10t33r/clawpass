# Clawpass Quick Start Guide

Get started with Clawpass in 5 minutes.

## Installation

```bash
npm install clawpass ethers
```

## Basic Usage

### 1. Setup

```typescript
import { ethers } from 'ethers';
import { ClawpassClient } from 'clawpass';

// Setup provider
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// Initialize Clawpass
const clawpass = new ClawpassClient({
  identityRegistryAddress: '0x...',
  reputationRegistryAddress: '0x...',
  validationRegistryAddress: '0x...',
  providerOrSigner: signer,
});
```

### 2. Register an Agent

```typescript
import { createDataURI } from 'clawpass';

// Create registration file
const registrationFile = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
  name: 'MyAIAgent',
  description: 'An AI agent for data analysis',
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
  supportedTrust: ['reputation'],
};

// Register on blockchain
const agentURI = createDataURI(registrationFile);
const agentId = await clawpass.identity.register(agentURI);

console.log('Agent registered with ID:', agentId);
```

### 3. Give Feedback

```typescript
import { toFixedPoint } from 'clawpass';

// Submit feedback
await clawpass.reputation.giveFeedback({
  agentId: 1n,
  value: toFixedPoint(4.5, 1), // 4.5 stars
  valueDecimals: 1,
  tag1: 'quality',
  tag2: 'performance',
});

console.log('Feedback submitted');
```

### 4. Get Agent Info

```typescript
// Fetch agent information
const agentInfo = await clawpass.getAgentInfo(1n);

console.log('Agent Name:', agentInfo.registration.name);
console.log('Owner:', agentInfo.owner);
console.log('Services:', agentInfo.registration.services);
```

### 5. Check Reputation

```typescript
// Get reputation from trusted reviewers
const trustedClients = [
  '0x1234567890123456789012345678901234567890',
  '0x0987654321098765432109876543210987654321',
];

const reputation = await clawpass.getAgentReputation(
  1n,
  trustedClients,
  'quality' // optional filter
);

console.log('Total Reviews:', reputation.summary.count);
console.log('Average Score:', reputation.summary.summaryValue);
```

### 6. Request Validation

```typescript
import { calculateHash } from 'clawpass';

// Prepare validation request
const requestData = JSON.stringify({
  task: 'Verify data analysis',
  input: { data: [1, 2, 3, 4, 5] },
  output: { mean: 3, median: 3 },
});

// Submit validation request
await clawpass.validation.validationRequest({
  validatorAddress: '0x...', // Validator contract address
  agentId: 1,
  requestURI: 'ipfs://QmValidationData...',
  requestHash: calculateHash(requestData),
});

console.log('Validation requested');
```

## Common Patterns

### Read-Only Mode

For applications that only read data:

```typescript
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');

const clawpass = new ClawpassClient({
  identityRegistryAddress: '0x...',
  reputationRegistryAddress: '0x...',
  validationRegistryAddress: '0x...',
  providerOrSigner: provider, // No signer
});

// Read operations work
const info = await clawpass.getAgentInfo(1n);

// Write operations throw error
// await clawpass.identity.register(...); // Error!
```

### Using Individual Clients

Use registry clients independently:

```typescript
import { IdentityRegistryClient } from 'clawpass';

const identity = new IdentityRegistryClient(
  '0x...', // Identity Registry address
  provider
);

const agentURI = await identity.getAgentURI(1n);
```

### Error Handling

```typescript
try {
  await clawpass.reputation.giveFeedback(feedbackData);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Not enough gas');
  } else {
    console.error('Feedback failed:', error.message);
  }
}
```

### Working with IPFS

```typescript
import { createIPFSUri, ipfsToHTTP } from 'clawpass';

// Create IPFS URI
const ipfsUri = createIPFSUri('QmYourCID');
// Result: 'ipfs://QmYourCID'

// Convert to HTTP gateway URL
const httpUrl = ipfsToHTTP(ipfsUri);
// Result: 'https://ipfs.io/ipfs/QmYourCID'

// Use custom gateway
const customUrl = ipfsToHTTP(ipfsUri, 'https://gateway.pinata.cloud');
// Result: 'https://gateway.pinata.cloud/ipfs/QmYourCID'
```

### Fixed-Point Numbers

```typescript
import { toFixedPoint, fromFixedPoint } from 'clawpass';

// Convert to fixed-point (for blockchain)
const value = toFixedPoint(4.5, 1); // 45n (4.5 with 1 decimal)
const value2 = toFixedPoint(99.99, 2); // 9999n (99.99 with 2 decimals)

// Convert from fixed-point (from blockchain)
const number = fromFixedPoint(45n, 1); // 4.5
const number2 = fromFixedPoint(9999n, 2); // 99.99
```

## Integration Examples

### Moltbook Integration

```typescript
import { MoltbookClawpassIntegration } from 'clawpass/examples/moltbook-integration';

const integration = new MoltbookClawpassIntegration(clawpass);

// Register moltbook agent
const agentId = await integration.registerAgent(
  moltbookAgent,
  '1', // chainId
  registryAddress
);

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

console.log('Overall Trust Score:', trustScore.overallScore);
```

### Moltx.io Integration

```typescript
import { MoltxClawpassIntegration } from 'clawpass/examples/moltx-integration';

const integration = new MoltxClawpassIntegration(clawpass);

// Get comprehensive agent profile
const profile = await integration.getAgentProfile(
  agentId,
  trustedReviewers
);

console.log('Agent:', profile.name);
console.log('Trust Score:', profile.trustScore.overall);
console.log('Services:', profile.services);

// Find agents by service type
const a2aAgents = await integration.findAgentsByService(
  [1n, 2n, 3n], // agent IDs to search
  'A2A' // service name
);

console.log('Found', a2aAgents.length, 'A2A agents');

// Compare multiple agents
const comparison = await integration.compareAgents(
  [1n, 2n, 3n],
  trustedReviewers
);

comparison.forEach(agent => {
  console.log(`${agent.name}: ${agent.trustScore}/100`);
});
```

## Next Steps

- Read the [full documentation](README.md)
- Explore [integration examples](examples/)
- Check the [architecture guide](ARCHITECTURE.md)
- Review [deployment guide](DEPLOYMENT.md)
- See [ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004)

## Need Help?

- Open an issue on GitHub
- Join our Discord community
- Email: support@clawpass.dev
- Read the [troubleshooting guide](DEPLOYMENT.md#troubleshooting)
