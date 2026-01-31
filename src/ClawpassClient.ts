/**
 * Unified Clawpass client for ERC-8004 interactions
 */

import { Provider, Signer } from 'ethers';
import { IdentityRegistryClient } from './clients/IdentityRegistryClient';
import { ReputationRegistryClient } from './clients/ReputationRegistryClient';
import { ValidationRegistryClient } from './clients/ValidationRegistryClient';

export interface ClawpassConfig {
  identityRegistryAddress: string;
  reputationRegistryAddress: string;
  validationRegistryAddress: string;
  providerOrSigner: Provider | Signer;
}

/**
 * Main Clawpass client providing unified access to all ERC-8004 registries
 */
export class ClawpassClient {
  public readonly identity: IdentityRegistryClient;
  public readonly reputation: ReputationRegistryClient;
  public readonly validation: ValidationRegistryClient;

  constructor(config: ClawpassConfig) {
    this.identity = new IdentityRegistryClient(
      config.identityRegistryAddress,
      config.providerOrSigner
    );

    this.reputation = new ReputationRegistryClient(
      config.reputationRegistryAddress,
      config.providerOrSigner
    );

    this.validation = new ValidationRegistryClient(
      config.validationRegistryAddress,
      config.providerOrSigner
    );
  }

  /**
   * Verify that reputation and validation registries are linked to the identity registry
   */
  async verifyRegistryLinks(): Promise<boolean> {
    const identityAddress = this.identity['contract'].target;
    const reputationIdentity = await this.reputation.getIdentityRegistry();
    const validationIdentity = await this.validation.getIdentityRegistry();

    return (
      reputationIdentity.toLowerCase() === identityAddress.toLowerCase() &&
      validationIdentity.toLowerCase() === identityAddress.toLowerCase()
    );
  }

  /**
   * Get comprehensive agent information
   */
  async getAgentInfo(agentId: bigint) {
    const [registrationFile, owner, wallet] = await Promise.all([
      this.identity.getAgentRegistrationFile(agentId),
      this.identity.getOwner(agentId),
      this.identity.getAgentWallet(agentId),
    ]);

    return {
      agentId,
      owner,
      wallet,
      registration: registrationFile,
    };
  }

  /**
   * Get agent reputation summary from trusted clients
   */
  async getAgentReputation(agentId: bigint, trustedClients: string[], tag1?: string, tag2?: string) {
    const summary = await this.reputation.getSummary(agentId, trustedClients, tag1, tag2);
    const allFeedback = await this.reputation.readAllFeedback(agentId, trustedClients, tag1, tag2);

    return {
      summary,
      feedback: allFeedback,
    };
  }

  /**
   * Get agent validation summary
   */
  async getAgentValidationSummary(agentId: bigint, validatorAddresses?: string[], tag?: string) {
    const summary = await this.validation.getSummary(agentId, validatorAddresses, tag);
    const validationHashes = await this.validation.getAgentValidations(agentId);

    return {
      summary,
      validationCount: validationHashes.length,
      validationHashes,
    };
  }
}
