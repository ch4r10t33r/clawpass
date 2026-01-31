# Clawpass as OpenClaw Plugin

Clawpass is packaged as an [OpenClaw](https://docs.openclaw.ai/) plugin so you can use ERC-8004 identity, reputation, and validation from OpenClaw agents and CLI.

## References

- [OpenClaw plugins CLI](https://docs.openclaw.ai/cli/plugins) — install, enable, list
- [Plugin manifest](https://docs.openclaw.ai/plugins/manifest) — `openclaw.plugin.json` and `configSchema`
- [Plugin system](https://docs.openclaw.ai/plugin) — register tools, CLI, RPC
- [Plugin agent tools](https://docs.openclaw.ai/plugins/agent-tools) — optional tools and parameters

## Requirements

- Plugin manifest: `openclaw.plugin.json` in the plugin root with `id` and `configSchema` (inline JSON Schema).
- Entry point: listed in `package.json` under `openclaw.extensions` (e.g. `./openclaw-plugin.ts`).
- Config: under `plugins.entries.clawpass.config` (rpcUrl + all three registry addresses required).

## Files

| File | Purpose |
|------|---------|
| `openclaw.plugin.json` | Manifest: id, name, description, configSchema, uiHints |
| `openclaw-plugin.ts` | Entry: register(api), registerTool(…), optional registerCli / registerGatewayMethod |
| `package.json` | `openclaw.extensions: ["./openclaw-plugin.ts"]` |

## Config schema

- **rpcUrl** (required): EVM JSON-RPC URL.
- **identityRegistryAddress** (required): ERC-8004 Identity Registry contract.
- **reputationRegistryAddress** (required): ERC-8004 Reputation Registry contract.
- **validationRegistryAddress** (required): ERC-8004 Validation Registry contract.
- **privateKey** (optional): Wallet private key for write operations (register, give feedback, validation request).
- **chainId** (optional): Chain ID.

## Optional agent tools

All Clawpass tools are **optional** (`optional: true`). Enable them per agent, e.g. in `agents.list[].tools.allow`:

- `clawpass_get_agent_info` — agentId → registration, owner, wallet
- `clawpass_get_reputation` — agentId, trustedClients [, tag1, tag2] → summary and feedback count
- `clawpass_give_feedback` — agentId, value, valueDecimals [, tag1, tag2, endpoint] (requires privateKey)
- `clawpass_request_validation` — validatorAddress, agentId, requestURI, requestData or requestHash (requires privateKey)
- `clawpass_validation_status` — requestHash → validator, response, tag, lastUpdate

## Install (development)

Link from a local clone:

```bash
openclaw plugins install -l ./path/to/clawpass
```

Then restart the gateway and set `plugins.entries.clawpass.config` (and optionally `tools.allow` for the Clawpass tools).

## Install (npm)

When published:

```bash
openclaw plugins install clawpass
```

## Validation

OpenClaw validates config using the plugin’s `configSchema` **without running plugin code**. Missing or invalid `openclaw.plugin.json` or `configSchema` causes plugin load failure and Doctor will report it.

## Security

- Plugins run **in-process** with the Gateway; only install trusted plugins.
- Prefer `plugins.allow` allowlists.
- `privateKey` is marked `sensitive: true` in uiHints; do not log or expose it.
