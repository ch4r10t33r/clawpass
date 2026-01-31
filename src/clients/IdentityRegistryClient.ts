/**
 * Client for interacting with ERC-8004 Identity Registry
 */

import { Contract, Provider, Signer, ethers } from 'ethers';
import IdentityRegistryABI from '../abis/IdentityRegistry.json';
import { MetadataEntry, AgentRegistrationFile } from '../types';
import { AgentRegistrationFileSchema } from '../schemas';

export class IdentityRegistryClient {
  private contract: Contract;
  private signer?: Signer;

  constructor(
    contractAddress: string,
    providerOrSigner: Provider | Signer
  ) {
    if ('provider' in providerOrSigner && providerOrSigner.provider) {
      this.signer = providerOrSigner as Signer;
      this.contract = new Contract(contractAddress, IdentityRegistryABI, this.signer);
    } else {
      this.contract = new Contract(contractAddress, IdentityRegistryABI, providerOrSigner);
    }
  }

  /**
   * Register a new agent with URI and optional metadata
   */
  async register(agentURI?: string, metadata?: MetadataEntry[]): Promise<bigint> {
    if (!this.signer) {
      throw new Error('Signer required for registration');
    }

    let tx;
    if (agentURI && metadata && metadata.length > 0) {
      const formattedMetadata = metadata.map((m) => ({
        metadataKey: m.metadataKey,
        metadataValue: m.metadataValue,
      }));
      tx = await this.contract['register(string,(string,bytes)[])'](agentURI, formattedMetadata);
    } else if (agentURI) {
      tx = await this.contract['register(string)'](agentURI);
    } else {
      tx = await this.contract['register()']();
    }

    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log: any) => log.fragment && log.fragment.name === 'Registered'
    );

    if (!event) {
      throw new Error('Registration event not found');
    }

    return event.args.agentId;
  }

  /**
   * Update the agent URI
   */
  async setAgentURI(agentId: bigint, newURI: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for updating URI');
    }

    const tx = await this.contract.setAgentURI(agentId, newURI);
    await tx.wait();
  }

  /**
   * Get the agent URI (tokenURI)
   */
  async getAgentURI(agentId: bigint): Promise<string> {
    return await this.contract.tokenURI(agentId);
  }

  /**
   * Fetch and parse the agent registration file from URI
   */
  async getAgentRegistrationFile(agentId: bigint): Promise<AgentRegistrationFile> {
    const uri = await this.getAgentURI(agentId);
    
    let content: string;
    
    if (uri.startsWith('data:')) {
      // Handle base64-encoded data URI
      const base64Data = uri.split(',')[1];
      content = Buffer.from(base64Data, 'base64').toString('utf-8');
    } else if (uri.startsWith('ipfs://')) {
      // Handle IPFS URI - would need IPFS gateway
      const cid = uri.replace('ipfs://', '');
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      content = await response.text();
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // Handle HTTP(S) URI
      const response = await fetch(uri);
      content = await response.text();
    } else {
      throw new Error(`Unsupported URI scheme: ${uri}`);
    }

    const data = JSON.parse(content);
    return AgentRegistrationFileSchema.parse(data);
  }

  /**
   * Set metadata for an agent
   */
  async setMetadata(agentId: bigint, metadataKey: string, metadataValue: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for setting metadata');
    }

    const tx = await this.contract.setMetadata(agentId, metadataKey, metadataValue);
    await tx.wait();
  }

  /**
   * Get metadata for an agent
   */
  async getMetadata(agentId: bigint, metadataKey: string): Promise<string> {
    return await this.contract.getMetadata(agentId, metadataKey);
  }

  /**
   * Get the agent wallet address
   */
  async getAgentWallet(agentId: bigint): Promise<string> {
    return await this.contract.getAgentWallet(agentId);
  }

  /**
   * Set the agent wallet with signature
   */
  async setAgentWallet(
    agentId: bigint,
    newWallet: string,
    deadline: bigint,
    signature: string
  ): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for setting agent wallet');
    }

    const tx = await this.contract.setAgentWallet(agentId, newWallet, deadline, signature);
    await tx.wait();
  }

  /**
   * Unset the agent wallet
   */
  async unsetAgentWallet(agentId: bigint): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for unsetting agent wallet');
    }

    const tx = await this.contract.unsetAgentWallet(agentId);
    await tx.wait();
  }

  /**
   * Get the owner of an agent
   */
  async getOwner(agentId: bigint): Promise<string> {
    return await this.contract.ownerOf(agentId);
  }

  /**
   * Create a signature for setting agent wallet (EIP-712)
   */
  async createAgentWalletSignature(
    agentId: bigint,
    newWallet: string,
    deadline: bigint,
    chainId: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for creating signature');
    }

    const domain = {
      name: 'IdentityRegistry',
      version: '1',
      chainId: chainId,
      verifyingContract: await this.contract.getAddress(),
    };

    const types = {
      SetAgentWallet: [
        { name: 'agentId', type: 'uint256' },
        { name: 'newWallet', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const value = {
      agentId: agentId,
      newWallet: newWallet,
      deadline: deadline,
    };

    return await this.signer.signTypedData(domain, types, value);
  }
}
