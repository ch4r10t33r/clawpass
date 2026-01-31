/**
 * Example integration with moltx.io
 * 
 * This demonstrates how moltx.io can use Clawpass to:
 * - Discover registered agents
 * - Verify agent credentials
 * - Track validation history
 */

import { ClawpassClient } from '../src';
import type { AgentRegistrationFile } from '../src';

interface MoltxAgentProfile {
  agentId: bigint;
  name: string;
  description: string;
  owner: string;
  wallet: string;
  services: Array<{
    name: string;
    endpoint: string;
  }>;
  trustScore: {
    reputation: number;
    validation: number;
    overall: number;
  };
  active: boolean;
}

class MoltxClawpassIntegration {
  private clawpass: ClawpassClient;

  constructor(clawpass: ClawpassClient) {
    this.clawpass = clawpass;
  }

  /**
   * Discover and fetch agent profile
   */
  async getAgentProfile(
    agentId: bigint,
    trustedReviewers: string[]
  ): Promise<MoltxAgentProfile> {
    // Get basic agent info
    const agentInfo = await this.clawpass.getAgentInfo(agentId);

    // Get reputation summary
    const reputation = await this.clawpass.getAgentReputation(
      agentId,
      trustedReviewers
    );

    // Get validation summary
    const validation = await this.clawpass.getAgentValidationSummary(agentId);

    // Calculate trust scores
    const reputationScore = reputation.summary.count > 0n
      ? (Number(reputation.summary.summaryValue) / Number(reputation.summary.count)) * 20 // Scale to 0-100
      : 0;

    const validationScore = validation.summary.averageResponse;
    const overallScore = (reputationScore + validationScore) / 2;

    return {
      agentId,
      name: agentInfo.registration.name,
      description: agentInfo.registration.description,
      owner: agentInfo.owner,
      wallet: agentInfo.wallet,
      services: agentInfo.registration.services.map(s => ({
        name: s.name,
        endpoint: s.endpoint,
      })),
      trustScore: {
        reputation: reputationScore,
        validation: validationScore,
        overall: overallScore,
      },
      active: agentInfo.registration.active,
    };
  }

  /**
   * Search for agents by service type
   */
  async findAgentsByService(
    agentIds: bigint[],
    serviceName: string
  ): Promise<Array<{
    agentId: bigint;
    name: string;
    endpoint: string;
  }>> {
    const results = [];

    for (const agentId of agentIds) {
      try {
        const registration = await this.clawpass.identity.getAgentRegistrationFile(agentId);
        
        const service = registration.services.find(s => s.name === serviceName);
        if (service) {
          results.push({
            agentId,
            name: registration.name,
            endpoint: service.endpoint,
          });
        }
      } catch (error) {
        console.error(`Error fetching agent ${agentId}:`, error);
      }
    }

    return results;
  }

  /**
   * Verify agent endpoint ownership
   */
  async verifyEndpointOwnership(
    agentId: bigint,
    endpointDomain: string
  ): Promise<boolean> {
    try {
      const registration = await this.clawpass.identity.getAgentRegistrationFile(agentId);
      
      // Fetch .well-known/agent-registration.json from the domain
      const response = await fetch(
        `https://${endpointDomain}/.well-known/agent-registration.json`
      );
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Check if the registration includes this agentId
      return data.registrations?.some(
        (reg: any) => reg.agentId === Number(agentId)
      ) ?? false;
    } catch (error) {
      console.error('Endpoint verification failed:', error);
      return false;
    }
  }

  /**
   * Get agent feedback history
   */
  async getAgentFeedbackHistory(
    agentId: bigint,
    limit?: number
  ): Promise<Array<{
    client: string;
    rating: number;
    tag1: string;
    tag2: string;
    timestamp?: string;
  }>> {
    const allFeedback = await this.clawpass.reputation.readAllFeedback(agentId);

    const history = allFeedback.map(fb => ({
      client: fb.clientAddress,
      rating: Number(fb.value) / (10 ** fb.valueDecimals),
      tag1: fb.tag1,
      tag2: fb.tag2,
    }));

    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get agent validation history
   */
  async getAgentValidationHistory(
    agentId: bigint
  ): Promise<Array<{
    requestHash: string;
    validator: string;
    score: number;
    tag: string;
    timestamp: bigint;
  }>> {
    const validationHashes = await this.clawpass.validation.getAgentValidations(agentId);

    const history = [];
    for (const hash of validationHashes) {
      const status = await this.clawpass.validation.getValidationStatus(hash);
      history.push({
        requestHash: hash,
        validator: status.validatorAddress,
        score: status.response,
        tag: status.tag,
        timestamp: status.lastUpdate,
      });
    }

    return history;
  }

  /**
   * Compare multiple agents
   */
  async compareAgents(
    agentIds: bigint[],
    trustedReviewers: string[]
  ): Promise<Array<{
    agentId: bigint;
    name: string;
    trustScore: number;
    feedbackCount: number;
    validationCount: number;
  }>> {
    const comparisons = [];

    for (const agentId of agentIds) {
      try {
        const profile = await this.getAgentProfile(agentId, trustedReviewers);
        const reputation = await this.clawpass.getAgentReputation(agentId, trustedReviewers);
        const validation = await this.clawpass.getAgentValidationSummary(agentId);

        comparisons.push({
          agentId,
          name: profile.name,
          trustScore: profile.trustScore.overall,
          feedbackCount: Number(reputation.summary.count),
          validationCount: validation.validationCount,
        });
      } catch (error) {
        console.error(`Error comparing agent ${agentId}:`, error);
      }
    }

    // Sort by trust score descending
    return comparisons.sort((a, b) => b.trustScore - a.trustScore);
  }
}

export { MoltxClawpassIntegration };
