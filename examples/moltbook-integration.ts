/**
 * Example integration with moltbook
 * 
 * This demonstrates how moltbook can use Clawpass to:
 * - Register AI agents
 * - Track agent reputation through peer feedback
 * - Validate agent performance
 */

import { ethers } from 'ethers';
import { ClawpassClient, toFixedPoint, createFeedbackFile } from '../src';
import type { AgentRegistrationFile } from '../src';

interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoints: {
    a2a?: string;
    mcp?: string;
  };
}

class MoltbookClawpassIntegration {
  private clawpass: ClawpassClient;
  private agentMapping: Map<string, bigint>; // moltbook ID -> blockchain agentId

  constructor(clawpass: ClawpassClient) {
    this.clawpass = clawpass;
    this.agentMapping = new Map();
  }

  /**
   * Register a moltbook agent on blockchain
   */
  async registerAgent(agent: MoltbookAgent, chainId: string, registryAddress: string): Promise<bigint> {
    const registrationFile: AgentRegistrationFile = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: agent.name,
      description: agent.description,
      services: [],
      x402Support: true,
      active: true,
      registrations: [],
      supportedTrust: ['reputation', 'crypto-economic'],
    };

    // Add A2A endpoint if available
    if (agent.endpoints.a2a) {
      registrationFile.services.push({
        name: 'A2A',
        endpoint: agent.endpoints.a2a,
        version: '0.3.0',
      });
    }

    // Add MCP endpoint if available
    if (agent.endpoints.mcp) {
      registrationFile.services.push({
        name: 'MCP',
        endpoint: agent.endpoints.mcp,
        version: '2025-06-18',
      });
    }

    // Register on blockchain
    const agentId = await this.clawpass.identity.register(
      JSON.stringify(registrationFile)
    );

    // Store mapping
    this.agentMapping.set(agent.id, agentId);

    return agentId;
  }

  /**
   * Submit peer feedback for an agent
   */
  async submitPeerFeedback(
    moltbookAgentId: string,
    rating: number, // 0-5 stars
    reviewer: string,
    taskContext?: {
      taskId?: string;
      endpoint?: string;
      skills?: string[];
    }
  ): Promise<void> {
    const agentId = this.agentMapping.get(moltbookAgentId);
    if (!agentId) {
      throw new Error('Agent not registered on blockchain');
    }

    // Convert rating to fixed point (1 decimal place)
    const value = toFixedPoint(rating, 1);

    await this.clawpass.reputation.giveFeedback({
      agentId,
      value,
      valueDecimals: 1,
      tag1: 'peer-review',
      tag2: 'moltbook',
      endpoint: taskContext?.endpoint,
    });
  }

  /**
   * Get agent reputation from trusted peers
   */
  async getAgentReputation(
    moltbookAgentId: string,
    trustedPeers: string[]
  ): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const agentId = this.agentMapping.get(moltbookAgentId);
    if (!agentId) {
      throw new Error('Agent not registered on blockchain');
    }

    const summary = await this.clawpass.reputation.getSummary(
      agentId,
      trustedPeers,
      'peer-review'
    );

    // Convert from fixed point
    const averageRating = Number(summary.summaryValue) / (10 ** summary.summaryValueDecimals);

    return {
      averageRating,
      totalReviews: Number(summary.count),
    };
  }

  /**
   * Validate agent output
   */
  async requestValidation(
    moltbookAgentId: string,
    validatorAddress: string,
    taskData: {
      input: any;
      output: any;
      metadata?: any;
    }
  ): Promise<void> {
    const agentId = this.agentMapping.get(moltbookAgentId);
    if (!agentId) {
      throw new Error('Agent not registered on blockchain');
    }

    const requestData = JSON.stringify(taskData);
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes(requestData));

    await this.clawpass.validation.validationRequest({
      validatorAddress,
      agentId: Number(agentId),
      requestURI: `data:application/json;base64,${Buffer.from(requestData).toString('base64')}`,
      requestHash,
    });
  }

  /**
   * Check if agent validation passed
   */
  async checkValidation(requestHash: string): Promise<{
    passed: boolean;
    score: number;
  }> {
    const status = await this.clawpass.validation.getValidationStatus(requestHash);

    return {
      passed: status.response >= 50, // 50+ out of 100 is considered passing
      score: status.response,
    };
  }

  /**
   * Get comprehensive agent trust score
   */
  async getAgentTrustScore(
    moltbookAgentId: string,
    trustedPeers: string[]
  ): Promise<{
    reputationScore: number;
    validationScore: number;
    overallScore: number;
  }> {
    const agentId = this.agentMapping.get(moltbookAgentId);
    if (!agentId) {
      throw new Error('Agent not registered on blockchain');
    }

    // Get reputation
    const reputation = await this.getAgentReputation(moltbookAgentId, trustedPeers);

    // Get validation summary
    const validationSummary = await this.clawpass.validation.getSummary(agentId);

    const reputationScore = (reputation.averageRating / 5) * 100; // Convert to 0-100
    const validationScore = validationSummary.averageResponse;
    const overallScore = (reputationScore + validationScore) / 2;

    return {
      reputationScore,
      validationScore,
      overallScore,
    };
  }
}

export { MoltbookClawpassIntegration };
