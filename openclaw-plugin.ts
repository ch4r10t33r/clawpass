/**
 * Clawpass OpenClaw plugin
 *
 * Exposes ERC-8004 identity, reputation, and validation as agent tools and CLI.
 * Config: plugins.entries.clawpass.config
 *
 * @see https://docs.openclaw.ai/cli/plugins
 * @see https://docs.openclaw.ai/plugins/manifest
 * @see https://docs.openclaw.ai/plugins/agent-tools
 */

import { ClawpassClient, toFixedPoint, calculateHash } from 'clawpass';
import { ethers } from 'ethers';

type Api = {
  config: Record<string, unknown>;
  logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };
  registerTool: (tool: ToolDef, opts?: { optional?: boolean }) => void;
  registerGatewayMethod?: (name: string, handler: (ctx: { respond: (ok: boolean, data: unknown) => void }) => void) => void;
  registerCli?: (fn: (ctx: { program: { command: (name: string) => { description: (d: string) => { action: (fn: () => void) => void } } } }) => void, opts: { commands: string[] }) => void;
};

type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (id: string, params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;
};

function getPluginConfig(api: Api): Record<string, unknown> | null {
  const entries = api.config?.plugins as Record<string, unknown> | undefined;
  const pluginsEntries = entries?.entries as Record<string, unknown> | undefined;
  const clawpassEntry = pluginsEntries?.clawpass as Record<string, unknown> | undefined;
  return clawpassEntry?.config as Record<string, unknown> | null ?? null;
}

function createClient(api: Api): ClawpassClient | null {
  const cfg = getPluginConfig(api);
  if (!cfg?.rpcUrl || !cfg?.identityRegistryAddress || !cfg?.reputationRegistryAddress || !cfg?.validationRegistryAddress) {
    return null;
  }
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl as string);
  const signer = cfg.privateKey
    ? new ethers.Wallet(cfg.privateKey as string, provider)
    : provider;
  return new ClawpassClient({
    identityRegistryAddress: cfg.identityRegistryAddress as string,
    reputationRegistryAddress: cfg.reputationRegistryAddress as string,
    validationRegistryAddress: cfg.validationRegistryAddress as string,
    providerOrSigner: signer,
  });
}

let clientInstance: ClawpassClient | null = null;

function getClient(api: Api): ClawpassClient | null {
  if (!clientInstance) {
    clientInstance = createClient(api);
  }
  return clientInstance;
}

export default function register(api: Api): void {
  api.logger?.info?.('Clawpass plugin registering');

  // Optional agent tools (opt-in via tools.allow)
  api.registerTool(
    {
      name: 'clawpass_get_agent_info',
      description: 'Get ERC-8004 agent info: registration, owner, wallet. Requires agentId (number).',
      parameters: {
        type: 'object',
        properties: { agentId: { type: 'number', description: 'ERC-8004 agent ID' } },
        required: ['agentId'],
      },
      async execute(_id, params) {
        const client = getClient(api);
        if (!client) {
          return { content: [{ type: 'text', text: 'Clawpass not configured. Set plugins.entries.clawpass.config (rpcUrl, identityRegistryAddress, reputationRegistryAddress, validationRegistryAddress).' }] };
        }
        try {
          const agentId = BigInt(Number(params.agentId));
          const info = await client.getAgentInfo(agentId);
          return { content: [{ type: 'text', text: JSON.stringify({ agentId: String(agentId), owner: info.owner, wallet: info.wallet, name: info.registration.name, description: info.registration.description, services: info.registration.services }, null, 2) }] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: 'text', text: `Error: ${msg}` }] };
        }
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: 'clawpass_get_reputation',
      description: 'Get agent reputation from trusted clients. Requires agentId (number) and trustedClients (array of Ethereum addresses). Optional tag1, tag2.',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'number', description: 'ERC-8004 agent ID' },
          trustedClients: { type: 'array', items: { type: 'string' }, description: 'Addresses of trusted reviewers' },
          tag1: { type: 'string' },
          tag2: { type: 'string' },
        },
        required: ['agentId', 'trustedClients'],
      },
      async execute(_id, params) {
        const client = getClient(api);
        if (!client) {
          return { content: [{ type: 'text', text: 'Clawpass not configured.' }] };
        }
        try {
          const agentId = BigInt(Number(params.agentId));
          const trustedClients = (params.trustedClients as string[]) || [];
          if (trustedClients.length === 0) {
            return { content: [{ type: 'text', text: 'trustedClients must be a non-empty array (Sybil protection).' }] };
          }
          const rep = await client.getAgentReputation(agentId, trustedClients, params.tag1 as string, params.tag2 as string);
          return { content: [{ type: 'text', text: JSON.stringify({ summary: { count: String(rep.summary.count), summaryValue: String(rep.summary.summaryValue), summaryValueDecimals: rep.summary.summaryValueDecimals }, feedbackCount: rep.feedback.length }, null, 2) }] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: 'text', text: `Error: ${msg}` }] };
        }
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: 'clawpass_give_feedback',
      description: 'Submit feedback for an agent (requires privateKey in plugin config). Params: agentId (number), value (number, e.g. 4.5), valueDecimals (0-18), optional tag1, tag2, endpoint.',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'number' },
          value: { type: 'number', description: 'e.g. 4.5 for 4.5 stars' },
          valueDecimals: { type: 'number', description: '0-18' },
          tag1: { type: 'string' },
          tag2: { type: 'string' },
          endpoint: { type: 'string' },
        },
        required: ['agentId', 'value', 'valueDecimals'],
      },
      async execute(_id, params) {
        const client = getClient(api);
        if (!client) {
          return { content: [{ type: 'text', text: 'Clawpass not configured.' }] };
        }
        try {
          const value = toFixedPoint(Number(params.value), Number(params.valueDecimals) || 1);
          await client.reputation.giveFeedback({
            agentId: BigInt(Number(params.agentId)),
            value,
            valueDecimals: Number(params.valueDecimals) || 1,
            tag1: params.tag1 as string,
            tag2: params.tag2 as string,
            endpoint: params.endpoint as string,
          });
          return { content: [{ type: 'text', text: 'Feedback submitted successfully.' }] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: 'text', text: `Error: ${msg}` }] };
        }
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: 'clawpass_request_validation',
      description: 'Request validation for an agent (requires privateKey). Params: validatorAddress (string), agentId (number), requestURI (string), requestData (string, will be hashed) or requestHash (string).',
      parameters: {
        type: 'object',
        properties: {
          validatorAddress: { type: 'string' },
          agentId: { type: 'number' },
          requestURI: { type: 'string' },
          requestData: { type: 'string', description: 'Payload to hash if requestHash not provided' },
          requestHash: { type: 'string' },
        },
        required: ['validatorAddress', 'agentId', 'requestURI'],
      },
      async execute(_id, params) {
        const client = getClient(api);
        if (!client) {
          return { content: [{ type: 'text', text: 'Clawpass not configured.' }] };
        }
        try {
          const requestHash = (params.requestHash as string) || (params.requestData ? calculateHash(String(params.requestData)) : '');
          if (!requestHash) {
            return { content: [{ type: 'text', text: 'Provide requestHash or requestData.' }] };
          }
          await client.validation.validationRequest({
            validatorAddress: params.validatorAddress as string,
            agentId: Number(params.agentId),
            requestURI: params.requestURI as string,
            requestHash,
          });
          return { content: [{ type: 'text', text: 'Validation requested successfully.' }] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: 'text', text: `Error: ${msg}` }] };
        }
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: 'clawpass_validation_status',
      description: 'Get validation status for a request. Requires requestHash (string).',
      parameters: {
        type: 'object',
        properties: { requestHash: { type: 'string' } },
        required: ['requestHash'],
      },
      async execute(_id, params) {
        const client = getClient(api);
        if (!client) {
          return { content: [{ type: 'text', text: 'Clawpass not configured.' }] };
        }
        try {
          const status = await client.validation.getValidationStatus(params.requestHash as string);
          return { content: [{ type: 'text', text: JSON.stringify({ validatorAddress: status.validatorAddress, agentId: String(status.agentId), response: status.response, tag: status.tag, lastUpdate: String(status.lastUpdate) }, null, 2) }] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: 'text', text: `Error: ${msg}` }] };
        }
      },
    },
    { optional: true }
  );

  if (api.registerGatewayMethod) {
    api.registerGatewayMethod('clawpass.status', ({ respond }) => {
      const client = getClient(api);
      respond(!!client, { configured: !!client });
    });
  }

  if (api.registerCli) {
    api.registerCli(
      ({ program }) => {
        program
          .command('clawpass')
          .description('Clawpass ERC-8004 status')
          .action(() => {
            const client = getClient(api);
            const cfg = getPluginConfig(api);
            if (!cfg) {
              console.log('Clawpass: not configured (plugins.entries.clawpass.config)');
              return;
            }
            if (!client) {
              console.log('Clawpass: invalid or incomplete config (rpcUrl + all three registry addresses required)');
              return;
            }
            console.log('Clawpass: configured and ready');
          });
      },
      { commands: ['clawpass'] }
    );
  }

  api.logger?.info?.('Clawpass plugin registered (optional tools: clawpass_get_agent_info, clawpass_get_reputation, clawpass_give_feedback, clawpass_request_validation, clawpass_validation_status)');
}
