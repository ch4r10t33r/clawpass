/**
 * Moltbook + Clawpass Integration Example
 *
 * This script demonstrates how AI agents can:
 * 1. Authenticate with Moltbook (web2 identity)
 * 2. Register on-chain identity via ERC-8004 (web3 identity)
 * 3. Bridge both systems for unified reputation management
 *
 * Flow:
 *   Moltbook (social reputation) <---> Clawpass <---> ERC-8004 (on-chain reputation)
 */

import { ClawpassClient } from '@ch4r10teer41/clawpass';

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Moltbook API (web2 identity)
  moltbook: {
    baseUrl: 'https://moltbook.com/api/v1',
    agentApiKey: process.env.MOLTBOOK_API_KEY!, // Bot's API key (starts with 'molt_')
    appApiKey: process.env.MOLTBOOK_APP_KEY!, // App's API key (starts with 'moltdev_')
  },

  // ERC-8004 (web3 identity via Clawpass)
  erc8004: {
    rpcUrl: process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
    identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS!,
    reputationRegistry: process.env.REPUTATION_REGISTRY_ADDRESS!,
    validationRegistry: process.env.VALIDATION_REGISTRY_ADDRESS!,
    privateKey: process.env.AGENT_PRIVATE_KEY!, // Agent's wallet private key
  },
};

// =============================================================================
// Moltbook API Client
// =============================================================================

class MoltbookClient {
  constructor(
    private baseUrl: string,
    private agentApiKey?: string,
    private appApiKey?: string
  ) {}

  /**
   * Generate a temporary identity token for the agent.
   * This token can be shared safely and expires in 1 hour.
   */
  async generateIdentityToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/agents/me/identity-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.agentApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Moltbook token generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Verify an identity token and get the agent's profile.
   * Use this to authenticate agents calling your service.
   */
  async verifyIdentityToken(token: string): Promise<MoltbookAgent> {
    const response = await fetch(`${this.baseUrl}/agents/verify-identity`, {
      method: 'POST',
      headers: {
        'X-Moltbook-App-Key': this.appApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error(`Moltbook verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.valid) {
      throw new Error('Invalid or expired Moltbook identity token');
    }

    return data.agent;
  }
}

interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  karma: number;
  avatar_url: string;
  is_claimed: boolean;
  created_at: string;
  follower_count: number;
  stats: {
    posts: number;
    comments: number;
  };
  owner?: {
    x_handle: string;
    x_name: string;
    x_verified: boolean;
    x_follower_count: number;
  };
}

// =============================================================================
// Unified Agent Identity Manager
// =============================================================================

class AgentIdentityManager {
  private moltbook: MoltbookClient;
  private clawpass: ClawpassClient;

  constructor(config: typeof CONFIG) {
    this.moltbook = new MoltbookClient(
      config.moltbook.baseUrl,
      config.moltbook.agentApiKey,
      config.moltbook.appApiKey
    );

    this.clawpass = new ClawpassClient({
      rpcUrl: config.erc8004.rpcUrl,
      identityRegistryAddress: config.erc8004.identityRegistry,
      reputationRegistryAddress: config.erc8004.reputationRegistry,
      validationRegistryAddress: config.erc8004.validationRegistry,
      privateKey: config.erc8004.privateKey,
    });
  }

  /**
   * Register agent on-chain with Moltbook identity linked in metadata.
   *
   * This creates a permanent on-chain identity (ERC-8004) that references
   * the agent's Moltbook profile, bridging web2 and web3 identity.
   */
  async registerOnChain(moltbookAgent: MoltbookAgent): Promise<bigint> {
    console.log(`\n📝 Registering "${moltbookAgent.name}" on-chain...`);

    // Create metadata URI linking to Moltbook profile
    // In production, you'd host this JSON on IPFS or a server
    const metadata = {
      name: moltbookAgent.name,
      description: moltbookAgent.description,
      image: moltbookAgent.avatar_url,
      external_url: `https://moltbook.com/agents/${moltbookAgent.id}`,
      attributes: [
        { trait_type: 'platform', value: 'moltbook' },
        { trait_type: 'moltbook_id', value: moltbookAgent.id },
        { trait_type: 'moltbook_karma', value: moltbookAgent.karma },
        { trait_type: 'posts', value: moltbookAgent.stats.posts },
        { trait_type: 'comments', value: moltbookAgent.stats.comments },
        { trait_type: 'claimed', value: moltbookAgent.is_claimed },
      ],
    };

    // Encode metadata as data URI (for demo; use IPFS in production)
    const metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

    // Register on ERC-8004 Identity Registry
    const agentId = await this.clawpass.identity.register(metadataUri);

    console.log(`✅ Registered on-chain with Agent ID: ${agentId}`);
    console.log(`   Metadata URI: ${metadataUri.slice(0, 50)}...`);

    return agentId;
  }

  /**
   * Sync Moltbook karma to on-chain reputation.
   *
   * This allows other agents/services to query reputation on-chain
   * without needing Moltbook API access.
   */
  async syncReputationToChain(agentId: bigint, moltbookAgent: MoltbookAgent): Promise<void> {
    console.log(`\n🔄 Syncing reputation to chain...`);

    // Give feedback based on Moltbook karma
    // Category: 0 = general, 1 = quality, 2 = reliability, etc.
    const category = 0; // General category
    const value = Math.min(moltbookAgent.karma, 1000); // Cap at 1000 for demo
    const comment = `Synced from Moltbook. Karma: ${moltbookAgent.karma}, Posts: ${moltbookAgent.stats.posts}`;

    await this.clawpass.reputation.giveFeedback(agentId, category, value, comment);

    console.log(`✅ Reputation synced: ${value} points in category ${category}`);
  }

  /**
   * Get unified identity across both platforms.
   */
  async getUnifiedIdentity(
    agentId: bigint
  ): Promise<{ onChain: any; moltbook: MoltbookAgent | null }> {
    // Get on-chain identity
    const onChainAgent = await this.clawpass.identity.getAgent(agentId);

    // Try to extract Moltbook ID from metadata and fetch profile
    let moltbookAgent: MoltbookAgent | null = null;

    if (onChainAgent.metadataURI.startsWith('data:application/json;base64,')) {
      try {
        const base64 = onChainAgent.metadataURI.replace('data:application/json;base64,', '');
        const metadata = JSON.parse(Buffer.from(base64, 'base64').toString());
        const moltbookId = metadata.attributes?.find(
          (a: any) => a.trait_type === 'moltbook_id'
        )?.value;

        if (moltbookId) {
          // In a real app, you'd fetch the current Moltbook profile here
          console.log(`   Linked Moltbook ID: ${moltbookId}`);
        }
      } catch {
        // Metadata parsing failed, no Moltbook link
      }
    }

    return { onChain: onChainAgent, moltbook: moltbookAgent };
  }

  /**
   * Get combined reputation from both platforms.
   */
  async getCombinedReputation(
    agentId: bigint,
    moltbookAgent?: MoltbookAgent
  ): Promise<{
    onChain: { average: number; count: number };
    moltbook: { karma: number; posts: number; comments: number } | null;
    combined: number;
  }> {
    // Get on-chain reputation
    const onChainRep = await this.clawpass.reputation.getAverageRating(agentId);

    // Moltbook reputation
    const moltbookRep = moltbookAgent
      ? {
          karma: moltbookAgent.karma,
          posts: moltbookAgent.stats.posts,
          comments: moltbookAgent.stats.comments,
        }
      : null;

    // Calculate combined score (weighted average)
    // On-chain: 60%, Moltbook karma: 40%
    const onChainScore = onChainRep.average;
    const moltbookScore = moltbookRep ? Math.min(moltbookRep.karma / 10, 100) : 0;
    const combined = onChainScore * 0.6 + moltbookScore * 0.4;

    return {
      onChain: onChainRep,
      moltbook: moltbookRep,
      combined: Math.round(combined * 100) / 100,
    };
  }

  /**
   * Request on-chain validation for the agent.
   */
  async requestValidation(agentId: bigint, validatorAddress: string): Promise<bigint> {
    console.log(`\n🔐 Requesting validation from ${validatorAddress}...`);

    const requestId = await this.clawpass.validation.requestValidation(agentId, validatorAddress);

    console.log(`✅ Validation request created: ${requestId}`);
    return requestId;
  }
}

// =============================================================================
// Example Usage
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Moltbook + Clawpass (ERC-8004) Integration Demo');
  console.log('═══════════════════════════════════════════════════════════════');

  const manager = new AgentIdentityManager(CONFIG);

  // Step 1: Agent authenticates with Moltbook
  console.log('\n📱 Step 1: Authenticate with Moltbook');
  console.log('─────────────────────────────────────────────────────────────────');

  const moltbook = new MoltbookClient(
    CONFIG.moltbook.baseUrl,
    CONFIG.moltbook.agentApiKey,
    CONFIG.moltbook.appApiKey
  );

  // Agent generates identity token
  const identityToken = await moltbook.generateIdentityToken();
  console.log(`   Identity token generated: ${identityToken.slice(0, 20)}...`);

  // Service verifies token and gets agent profile
  const agent = await moltbook.verifyIdentityToken(identityToken);
  console.log(`   ✅ Verified: ${agent.name}`);
  console.log(`   Karma: ${agent.karma} | Posts: ${agent.stats.posts} | Followers: ${agent.follower_count}`);

  // Step 2: Register on-chain identity via Clawpass
  console.log('\n⛓️  Step 2: Register On-Chain Identity (ERC-8004)');
  console.log('─────────────────────────────────────────────────────────────────');

  const agentId = await manager.registerOnChain(agent);

  // Step 3: Sync reputation to chain
  console.log('\n📊 Step 3: Sync Reputation to Chain');
  console.log('─────────────────────────────────────────────────────────────────');

  await manager.syncReputationToChain(agentId, agent);

  // Step 4: Query combined reputation
  console.log('\n🏆 Step 4: Get Combined Reputation');
  console.log('─────────────────────────────────────────────────────────────────');

  const reputation = await manager.getCombinedReputation(agentId, agent);
  console.log(`   On-chain: ${reputation.onChain.average} avg (${reputation.onChain.count} ratings)`);
  console.log(`   Moltbook: ${reputation.moltbook?.karma} karma`);
  console.log(`   Combined Score: ${reputation.combined}`);

  // Step 5: Request validation (optional)
  console.log('\n🔐 Step 5: Request Validation (Optional)');
  console.log('─────────────────────────────────────────────────────────────────');

  const validatorAddress = '0x1234567890123456789012345678901234567890'; // Example validator
  // await manager.requestValidation(agentId, validatorAddress);
  console.log('   (Skipped - uncomment to request validation)');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   Integration Complete!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`
Summary:
  - Moltbook ID: ${agent.id}
  - On-Chain Agent ID: ${agentId}
  - Combined Reputation: ${reputation.combined}

The agent now has:
  ✅ Web2 identity on Moltbook (social, karma-based)
  ✅ Web3 identity on ERC-8004 (on-chain, trustless)
  ✅ Linked metadata bridging both systems
  ✅ Portable reputation across platforms
`);
}

// =============================================================================
// Middleware Example: Authenticate requests with both systems
// =============================================================================

/**
 * Express middleware example for authenticating agents.
 * Verifies Moltbook identity and checks on-chain reputation.
 */
export function createAuthMiddleware(manager: AgentIdentityManager) {
  return async (req: any, res: any, next: any) => {
    const moltbookToken = req.headers['x-moltbook-identity'];
    const onChainAgentId = req.headers['x-erc8004-agent-id'];

    if (!moltbookToken && !onChainAgentId) {
      return res.status(401).json({ error: 'No identity provided' });
    }

    try {
      // Option 1: Verify via Moltbook token
      if (moltbookToken) {
        const moltbook = new MoltbookClient(
          CONFIG.moltbook.baseUrl,
          undefined,
          CONFIG.moltbook.appApiKey
        );
        req.agent = await moltbook.verifyIdentityToken(moltbookToken);
        req.agentSource = 'moltbook';
      }

      // Option 2: Verify via on-chain agent ID
      if (onChainAgentId) {
        const clawpass = new ClawpassClient({
          rpcUrl: CONFIG.erc8004.rpcUrl,
          identityRegistryAddress: CONFIG.erc8004.identityRegistry,
          reputationRegistryAddress: CONFIG.erc8004.reputationRegistry,
          validationRegistryAddress: CONFIG.erc8004.validationRegistry,
        });

        const agentId = BigInt(onChainAgentId);
        req.onChainAgent = await clawpass.identity.getAgent(agentId);
        req.onChainReputation = await clawpass.reputation.getAverageRating(agentId);
        req.agentSource = req.agent ? 'both' : 'erc8004';
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid identity' });
    }
  };
}

// Run if executed directly
main().catch(console.error);
