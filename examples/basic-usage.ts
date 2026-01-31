/**
 * Basic usage examples for Clawpass
 */

import { ethers } from 'ethers';
import {
  ClawpassClient,
  createDataURI,
  toFixedPoint,
  createFeedbackFile,
  calculateHash,
} from '../src';
import type { AgentRegistrationFile, FeedbackData } from '../src';

async function main() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY');
  const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

  // Initialize Clawpass client
  const clawpass = new ClawpassClient({
    identityRegistryAddress: '0x...', // Your Identity Registry address
    reputationRegistryAddress: '0x...', // Your Reputation Registry address
    validationRegistryAddress: '0x...', // Your Validation Registry address
    providerOrSigner: signer,
  });

  // Verify registry links
  const isLinked = await clawpass.verifyRegistryLinks();
  console.log('Registries linked:', isLinked);

  // Example 1: Register a new agent
  const registrationFile: AgentRegistrationFile = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'MyAIAgent',
    description: 'An AI agent that provides data analysis services',
    image: 'https://example.com/agent-avatar.png',
    services: [
      {
        name: 'A2A',
        endpoint: 'https://agent.example.com/.well-known/agent-card.json',
        version: '0.3.0',
      },
      {
        name: 'MCP',
        endpoint: 'https://mcp.example.com/',
        version: '2025-06-18',
      },
    ],
    x402Support: true,
    active: true,
    registrations: [
      {
        agentId: 1,
        agentRegistry: 'eip155:1:0x...',
      },
    ],
    supportedTrust: ['reputation', 'crypto-economic'],
  };

  // Create data URI for on-chain storage
  const agentURI = createDataURI(registrationFile);

  // Register the agent
  const agentId = await clawpass.identity.register(agentURI);
  console.log('Agent registered with ID:', agentId);

  // Example 2: Give feedback to an agent
  const feedbackData: FeedbackData = {
    agentId: 1n,
    value: toFixedPoint(4.5, 1), // 4.5 stars out of 5
    valueDecimals: 1,
    tag1: 'starred',
    tag2: 'quality',
    endpoint: 'https://agent.example.com/GetPrice',
  };

  // Create feedback file for IPFS
  const feedbackFile = createFeedbackFile(
    'eip155:1:0x...',
    Number(feedbackData.agentId),
    await signer.getAddress(),
    4.5,
    1,
    {
      tag1: 'starred',
      tag2: 'quality',
      endpoint: 'https://agent.example.com/GetPrice',
      mcp: {
        tool: 'GetPrice',
      },
    }
  );

  // Upload to IPFS (pseudo-code - use your IPFS client)
  // const ipfsCID = await uploadToIPFS(JSON.stringify(feedbackFile));
  // feedbackData.feedbackURI = `ipfs://${ipfsCID}`;

  // Give feedback
  await clawpass.reputation.giveFeedback(feedbackData);
  console.log('Feedback submitted');

  // Example 3: Get agent information
  const agentInfo = await clawpass.getAgentInfo(1n);
  console.log('Agent Info:', agentInfo);

  // Example 4: Get agent reputation
  const trustedClients = ['0x...', '0x...']; // Addresses of trusted reviewers
  const reputation = await clawpass.getAgentReputation(1n, trustedClients, 'starred');
  console.log('Agent Reputation:', reputation);

  // Example 5: Request validation
  const requestData = JSON.stringify({
    task: 'Verify data analysis output',
    input: '...',
    output: '...',
  });

  await clawpass.validation.validationRequest({
    validatorAddress: '0x...', // Validator contract address
    agentId: 1,
    requestURI: 'ipfs://...', // URI with validation request data
    requestHash: calculateHash(requestData),
  });

  console.log('Validation requested');

  // Example 6: Get validation summary
  const validationSummary = await clawpass.getAgentValidationSummary(1n);
  console.log('Validation Summary:', validationSummary);
}

// Run examples
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
