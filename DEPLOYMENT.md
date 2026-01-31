# Deployment Guide

This guide covers deploying and using Clawpass in production environments.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Contract Deployment](#contract-deployment)
- [Integration](#integration)
- [Production Considerations](#production-considerations)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Installation

### npm

```bash
npm install clawpass ethers
```

### yarn

```bash
yarn add clawpass ethers
```

### pnpm

```bash
pnpm add clawpass ethers
```

## Configuration

### Basic Setup

```typescript
import { ethers } from 'ethers';
import { ClawpassClient } from 'clawpass';

// Configure provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Configure signer (for write operations)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Initialize Clawpass
const clawpass = new ClawpassClient({
  identityRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS,
  reputationRegistryAddress: process.env.REPUTATION_REGISTRY_ADDRESS,
  validationRegistryAddress: process.env.VALIDATION_REGISTRY_ADDRESS,
  providerOrSigner: signer,
});
```

### Environment Variables

Create a `.env` file:

```env
# Network Configuration
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
CHAIN_ID=1

# Contract Addresses
IDENTITY_REGISTRY_ADDRESS=0x...
REPUTATION_REGISTRY_ADDRESS=0x...
VALIDATION_REGISTRY_ADDRESS=0x...

# Wallet Configuration (for write operations)
PRIVATE_KEY=0x...

# Optional: IPFS Configuration
IPFS_GATEWAY=https://ipfs.io
IPFS_API_URL=https://api.pinata.cloud
IPFS_API_KEY=your_pinata_key
```

### Read-Only Configuration

For read-only operations, use a provider without a signer:

```typescript
const clawpass = new ClawpassClient({
  identityRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS,
  reputationRegistryAddress: process.env.REPUTATION_REGISTRY_ADDRESS,
  validationRegistryAddress: process.env.VALIDATION_REGISTRY_ADDRESS,
  providerOrSigner: provider, // No signer needed
});

// Read operations work
const agentInfo = await clawpass.getAgentInfo(1n);

// Write operations will throw
// await clawpass.identity.register(...); // Error: Signer required
```

## Contract Deployment

### Prerequisites

Before using Clawpass, the ERC-8004 contracts must be deployed:

1. Identity Registry (ERC-721 based)
2. Reputation Registry
3. Validation Registry

### Deployment Steps

1. **Deploy Identity Registry**
   ```solidity
   // Deploy IdentityRegistry contract
   // Note: This is a reference - actual deployment depends on your setup
   ```

2. **Deploy Reputation Registry**
   ```solidity
   // Deploy ReputationRegistry contract
   // Initialize with Identity Registry address
   reputationRegistry.initialize(identityRegistryAddress);
   ```

3. **Deploy Validation Registry**
   ```solidity
   // Deploy ValidationRegistry contract
   // Initialize with Identity Registry address
   validationRegistry.initialize(identityRegistryAddress);
   ```

4. **Verify Registry Links**
   ```typescript
   const isLinked = await clawpass.verifyRegistryLinks();
   if (!isLinked) {
     throw new Error('Registries not properly linked');
   }
   ```

### Multi-Chain Deployment

For multi-chain deployments:

```typescript
const chains = {
  mainnet: {
    chainId: 1,
    rpcUrl: 'https://eth-mainnet...',
    contracts: {
      identity: '0x...',
      reputation: '0x...',
      validation: '0x...',
    },
  },
  optimism: {
    chainId: 10,
    rpcUrl: 'https://optimism-mainnet...',
    contracts: {
      identity: '0x...',
      reputation: '0x...',
      validation: '0x...',
    },
  },
};

// Create clients for each chain
const clients = Object.entries(chains).reduce((acc, [name, config]) => {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  acc[name] = new ClawpassClient({
    identityRegistryAddress: config.contracts.identity,
    reputationRegistryAddress: config.contracts.reputation,
    validationRegistryAddress: config.contracts.validation,
    providerOrSigner: provider,
  });
  return acc;
}, {});
```

## Integration

### Moltbook Integration

```typescript
import { MoltbookClawpassIntegration } from 'clawpass/examples/moltbook-integration';

const integration = new MoltbookClawpassIntegration(clawpass);

// Register agents
const agentId = await integration.registerAgent(moltbookAgent, '1', registryAddress);

// Track feedback
await integration.submitPeerFeedback(agentId, 4.5, reviewerAddress);

// Get trust scores
const trustScore = await integration.getAgentTrustScore(agentId, trustedPeers);
```

### Moltx.io Integration

```typescript
import { MoltxClawpassIntegration } from 'clawpass/examples/moltx-integration';

const integration = new MoltxClawpassIntegration(clawpass);

// Discover agents
const profile = await integration.getAgentProfile(agentId, trustedReviewers);

// Find by service
const a2aAgents = await integration.findAgentsByService(agentIds, 'A2A');

// Compare agents
const comparison = await integration.compareAgents(agentIds, trustedReviewers);
```

### Custom Integration

```typescript
class CustomIntegration {
  constructor(private clawpass: ClawpassClient) {}

  async customOperation() {
    // Use clawpass clients for your specific needs
    const agentId = await this.clawpass.identity.register(...);
    await this.clawpass.reputation.giveFeedback(...);
    return agentId;
  }
}
```

## Production Considerations

### Security

1. **Private Key Management**
   - Never commit private keys to version control
   - Use environment variables or secret management services
   - Rotate keys regularly
   - Use hardware wallets for high-value operations

2. **Input Validation**
   - Always validate user input
   - Use Zod schemas for runtime validation
   - Sanitize data before blockchain operations

3. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Prevent abuse of write operations
   - Monitor for unusual activity

### Performance

1. **Caching**
   ```typescript
   // Cache agent registration files
   const cache = new Map<bigint, AgentRegistrationFile>();
   
   async function getCachedAgentInfo(agentId: bigint) {
     if (cache.has(agentId)) {
       return cache.get(agentId);
     }
     const info = await clawpass.identity.getAgentRegistrationFile(agentId);
     cache.set(agentId, info);
     return info;
   }
   ```

2. **Batch Operations**
   ```typescript
   // Fetch multiple agents in parallel
   const agentInfos = await Promise.all(
     agentIds.map(id => clawpass.getAgentInfo(id))
   );
   ```

3. **Connection Pooling**
   - Use connection pooling for RPC providers
   - Implement retry logic for failed requests
   - Monitor provider health

### Error Handling

```typescript
try {
  await clawpass.reputation.giveFeedback(feedbackData);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle insufficient gas
  } else if (error.code === 'NONCE_EXPIRED') {
    // Handle nonce issues
  } else {
    // Log and handle other errors
    console.error('Feedback submission failed:', error);
  }
}
```

### Gas Optimization

1. **Use Data URIs for Small Files**
   ```typescript
   import { createDataURI } from 'clawpass';
   
   // Store small registration files on-chain
   const dataURI = createDataURI(registrationFile);
   await clawpass.identity.register(dataURI);
   ```

2. **Batch Metadata Updates**
   ```typescript
   // Set multiple metadata entries in registration
   await clawpass.identity.register(agentURI, [
     { metadataKey: 'key1', metadataValue: 'value1' },
     { metadataKey: 'key2', metadataValue: 'value2' },
   ]);
   ```

## Monitoring

### Metrics to Track

1. **Transaction Metrics**
   - Success rate
   - Gas usage
   - Transaction time
   - Failed transactions

2. **Usage Metrics**
   - Agent registrations
   - Feedback submissions
   - Validation requests
   - Active agents

3. **Performance Metrics**
   - API response times
   - RPC provider latency
   - Cache hit rates

### Logging

```typescript
import { ClawpassClient } from 'clawpass';

class LoggingClawpassClient extends ClawpassClient {
  async getAgentInfo(agentId: bigint) {
    console.log(`Fetching agent info for ${agentId}`);
    const start = Date.now();
    try {
      const result = await super.getAgentInfo(agentId);
      console.log(`Fetched agent info in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`Failed to fetch agent info:`, error);
      throw error;
    }
  }
}
```

### Health Checks

```typescript
async function healthCheck() {
  try {
    // Verify registry links
    const isLinked = await clawpass.verifyRegistryLinks();
    
    // Test read operation
    const testAgentId = 1n;
    await clawpass.identity.getAgentURI(testAgentId);
    
    return { status: 'healthy', linked: isLinked };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Troubleshooting

### Common Issues

1. **"Signer required" Error**
   - Ensure you're using a Signer, not just a Provider
   - Check that the signer has sufficient funds

2. **"Invalid agent registry format" Error**
   - Verify the registry string format: `namespace:chainId:address`
   - Example: `eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

3. **"clientAddresses must not be empty" Error**
   - Always provide trusted client addresses for reputation queries
   - This prevents Sybil attacks

4. **Transaction Failures**
   - Check gas limits
   - Verify contract addresses
   - Ensure signer has sufficient balance
   - Check network congestion

5. **IPFS Issues**
   - Verify IPFS gateway is accessible
   - Check CID format
   - Try alternative gateways

### Debug Mode

```typescript
// Enable verbose logging
const clawpass = new ClawpassClient({
  ...config,
  providerOrSigner: provider,
});

// Log all contract calls
provider.on('debug', (info) => {
  console.log('RPC Call:', info);
});
```

### Support

For additional help:
- Check GitHub Issues
- Join Discord community
- Email support@clawpass.dev
- Review ERC-8004 specification
