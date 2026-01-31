/**
 * Client for interacting with ERC-8004 Validation Registry
 */

import { Contract, Provider, Signer, ethers } from 'ethers';
import ValidationRegistryABI from '../abis/ValidationRegistry.json';
import { ValidationRequest, ValidationResponse, ValidationStatus, ValidationSummary } from '../types';

export class ValidationRegistryClient {
  private contract: Contract;
  private signer?: Signer;

  constructor(
    contractAddress: string,
    providerOrSigner: Provider | Signer
  ) {
    if ('provider' in providerOrSigner && providerOrSigner.provider) {
      this.signer = providerOrSigner as Signer;
      this.contract = new Contract(contractAddress, ValidationRegistryABI, this.signer);
    } else {
      this.contract = new Contract(contractAddress, ValidationRegistryABI, providerOrSigner);
    }
  }

  /**
   * Get the identity registry address
   */
  async getIdentityRegistry(): Promise<string> {
    return await this.contract.getIdentityRegistry();
  }

  /**
   * Submit a validation request
   */
  async validationRequest(request: ValidationRequest): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for validation request');
    }

    const tx = await this.contract.validationRequest(
      request.validatorAddress,
      request.agentId,
      request.requestURI,
      request.requestHash
    );

    await tx.wait();
  }

  /**
   * Submit a validation response (called by validator)
   */
  async validationResponse(response: ValidationResponse): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for validation response');
    }

    if (response.response < 0 || response.response > 100) {
      throw new Error('response must be between 0 and 100');
    }

    const tx = await this.contract.validationResponse(
      response.requestHash,
      response.response,
      response.responseURI || '',
      response.responseHash || ethers.ZeroHash,
      response.tag || ''
    );

    await tx.wait();
  }

  /**
   * Get validation status for a request
   */
  async getValidationStatus(requestHash: string): Promise<ValidationStatus> {
    const result = await this.contract.getValidationStatus(requestHash);

    return {
      validatorAddress: result.validatorAddress,
      agentId: result.agentId,
      response: result.response,
      responseHash: result.responseHash,
      tag: result.tag,
      lastUpdate: result.lastUpdate,
    };
  }

  /**
   * Get validation summary for an agent
   */
  async getSummary(
    agentId: bigint,
    validatorAddresses?: string[],
    tag?: string
  ): Promise<ValidationSummary> {
    const result = await this.contract.getSummary(
      agentId,
      validatorAddresses || [],
      tag || ''
    );

    return {
      count: result.count,
      averageResponse: result.averageResponse,
    };
  }

  /**
   * Get all validation request hashes for an agent
   */
  async getAgentValidations(agentId: bigint): Promise<string[]> {
    return await this.contract.getAgentValidations(agentId);
  }

  /**
   * Get all validation request hashes for a validator
   */
  async getValidatorRequests(validatorAddress: string): Promise<string[]> {
    return await this.contract.getValidatorRequests(validatorAddress);
  }

  /**
   * Calculate request hash from request data
   */
  static calculateRequestHash(requestData: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(requestData));
  }

  /**
   * Calculate response hash from response data
   */
  static calculateResponseHash(responseData: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(responseData));
  }
}
