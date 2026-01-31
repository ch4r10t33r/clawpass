/**
 * Client for interacting with ERC-8004 Reputation Registry
 */

import { Contract, Provider, Signer, ethers } from 'ethers';
import ReputationRegistryABI from '../abis/ReputationRegistry.json';
import { FeedbackData, FeedbackRecord, FeedbackSummary, FeedbackFile } from '../types';
import { FeedbackFileSchema } from '../schemas';

export class ReputationRegistryClient {
  private contract: Contract;
  private signer?: Signer;

  constructor(
    contractAddress: string,
    providerOrSigner: Provider | Signer
  ) {
    if ('provider' in providerOrSigner && providerOrSigner.provider) {
      this.signer = providerOrSigner as Signer;
      this.contract = new Contract(contractAddress, ReputationRegistryABI, this.signer);
    } else {
      this.contract = new Contract(contractAddress, ReputationRegistryABI, providerOrSigner);
    }
  }

  /**
   * Get the identity registry address
   */
  async getIdentityRegistry(): Promise<string> {
    return await this.contract.getIdentityRegistry();
  }

  /**
   * Give feedback to an agent
   */
  async giveFeedback(feedback: FeedbackData): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for giving feedback');
    }

    if (feedback.valueDecimals < 0 || feedback.valueDecimals > 18) {
      throw new Error('valueDecimals must be between 0 and 18');
    }

    const tx = await this.contract.giveFeedback(
      feedback.agentId,
      feedback.value,
      feedback.valueDecimals,
      feedback.tag1 || '',
      feedback.tag2 || '',
      feedback.endpoint || '',
      feedback.feedbackURI || '',
      feedback.feedbackHash || ethers.ZeroHash
    );

    await tx.wait();
  }

  /**
   * Revoke feedback
   */
  async revokeFeedback(agentId: bigint, feedbackIndex: bigint): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for revoking feedback');
    }

    const tx = await this.contract.revokeFeedback(agentId, feedbackIndex);
    await tx.wait();
  }

  /**
   * Append a response to feedback
   */
  async appendResponse(
    agentId: bigint,
    clientAddress: string,
    feedbackIndex: bigint,
    responseURI: string,
    responseHash?: string
  ): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for appending response');
    }

    const tx = await this.contract.appendResponse(
      agentId,
      clientAddress,
      feedbackIndex,
      responseURI,
      responseHash || ethers.ZeroHash
    );

    await tx.wait();
  }

  /**
   * Get feedback summary for an agent
   */
  async getSummary(
    agentId: bigint,
    clientAddresses: string[],
    tag1?: string,
    tag2?: string
  ): Promise<FeedbackSummary> {
    if (clientAddresses.length === 0) {
      throw new Error('clientAddresses must not be empty (Sybil attack prevention)');
    }

    const result = await this.contract.getSummary(
      agentId,
      clientAddresses,
      tag1 || '',
      tag2 || ''
    );

    return {
      count: result.count,
      summaryValue: result.summaryValue,
      summaryValueDecimals: result.summaryValueDecimals,
    };
  }

  /**
   * Read a specific feedback
   */
  async readFeedback(
    agentId: bigint,
    clientAddress: string,
    feedbackIndex: bigint
  ): Promise<FeedbackRecord> {
    const result = await this.contract.readFeedback(agentId, clientAddress, feedbackIndex);

    return {
      agentId,
      clientAddress,
      feedbackIndex,
      value: result.value,
      valueDecimals: result.valueDecimals,
      tag1: result.tag1,
      tag2: result.tag2,
      isRevoked: result.isRevoked,
    };
  }

  /**
   * Read all feedback for an agent with optional filters
   */
  async readAllFeedback(
    agentId: bigint,
    clientAddresses?: string[],
    tag1?: string,
    tag2?: string,
    includeRevoked: boolean = false
  ): Promise<FeedbackRecord[]> {
    const result = await this.contract.readAllFeedback(
      agentId,
      clientAddresses || [],
      tag1 || '',
      tag2 || '',
      includeRevoked
    );

    const feedback: FeedbackRecord[] = [];
    for (let i = 0; i < result.clients.length; i++) {
      feedback.push({
        agentId,
        clientAddress: result.clients[i],
        feedbackIndex: result.feedbackIndexes[i],
        value: result.values[i],
        valueDecimals: result.valueDecimals[i],
        tag1: result.tag1s[i],
        tag2: result.tag2s[i],
        isRevoked: result.revokedStatuses[i],
      });
    }

    return feedback;
  }

  /**
   * Get response count for feedback
   */
  async getResponseCount(
    agentId: bigint,
    clientAddress?: string,
    feedbackIndex?: bigint,
    responders?: string[]
  ): Promise<bigint> {
    return await this.contract.getResponseCount(
      agentId,
      clientAddress || ethers.ZeroAddress,
      feedbackIndex || 0n,
      responders || []
    );
  }

  /**
   * Get all clients who gave feedback to an agent
   */
  async getClients(agentId: bigint): Promise<string[]> {
    return await this.contract.getClients(agentId);
  }

  /**
   * Get the last feedback index for a client-agent pair
   */
  async getLastIndex(agentId: bigint, clientAddress: string): Promise<bigint> {
    return await this.contract.getLastIndex(agentId, clientAddress);
  }

  /**
   * Fetch and parse feedback file from URI
   */
  async getFeedbackFile(feedbackURI: string): Promise<FeedbackFile> {
    let content: string;

    if (feedbackURI.startsWith('ipfs://')) {
      const cid = feedbackURI.replace('ipfs://', '');
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      content = await response.text();
    } else if (feedbackURI.startsWith('http://') || feedbackURI.startsWith('https://')) {
      const response = await fetch(feedbackURI);
      content = await response.text();
    } else {
      throw new Error(`Unsupported URI scheme: ${feedbackURI}`);
    }

    const data = JSON.parse(content);
    return FeedbackFileSchema.parse(data);
  }

  /**
   * Calculate hash for feedback file content
   */
  static calculateFeedbackHash(content: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(content));
  }
}
