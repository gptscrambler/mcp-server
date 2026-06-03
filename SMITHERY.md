# Publishing on Smithery (MCPB bundle)

Per [Smithery publish docs](https://smithery.ai/docs/build/publish#local-mcpb-bundle), stdio servers are published as an **MCPB bundle** (not a hosted MCP URL).

**Live server:** https://smithery.ai/servers/gptscrambler/mcp-server

## Prerequisites

- Node.js **20+** recommended for `npm run publish:smithery` (Smithery CLI also requires Node 20+)
- Smithery account: https://smithery.ai
- npm package `@gptscrambler/mcp-server` published

## 1. Build the bundle

```bash
cd packages/mcp-server   # or standalone clone of github.com/gptscrambler/mcp-server
npm ci
npm run build:mcpb
```

Output: `dist-bundle/server.mcpb` (~3 MB, includes `dist/` + production `node_modules`).

## 2. Log in to Smithery CLI

```bash
npx smithery@latest auth login
```

Open the `auth_url` printed in your browser and complete sign-in.

Verify:

```bash
npx smithery@latest auth whoami
```

## 3. Publish the bundle

```bash
npm run publish:smithery
```

This uses `scripts/smithery-deploy.mjs`, which uploads the MCPB with a full **server card** (tool `inputSchema` fields). The stock `smithery mcp publish` command alone can fail with HTTP 400 until Smithery/MCPB align on tool schemas in the manifest.

## Troubleshooting

### `` `File` is not defined as a global ``

Your default `node` is **older than 20** (common on Ubuntu: `/usr/bin/node` is 18). Smithery’s CLI needs the global `File` API for uploads.

- Prefer: `node -v` ≥ 20, then `npm run publish:smithery`
- Or install Node 20 via nvm/fnm and use that binary for publish

### `Invalid input: expected object, received undefined` (HTTP 400)

Smithery’s API requires each tool in the deploy **payload** to include an `inputSchema` object. MCPB `manifest.json` does not allow `inputSchema` on tools (validator rejects it), so use **`npm run publish:smithery`** (custom deploy) instead of raw:

```bash
npx smithery@latest mcp publish ./dist-bundle/server.mcpb -n gptscrambler/mcp-server
```

## What users get

- Smithery installs the **local stdio** server (no `https://gptscrambler.com/mcp` endpoint required).
- Users enter their API key in Smithery’s config UI → passed as `GPTSCRAMBLER_API_KEY`.
- Server calls your existing REST API at `https://gptscrambler.com/api/v1/*`.

## Hosted URL path (not used for this bundle)

The form at [smithery.ai/new](https://smithery.ai/new) that asks for **MCP Server URL** is for **Streamable HTTP** servers only. Do not use it for this package unless you later deploy a remote MCP gateway.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | MCPB manifest (tools, user_config, env mapping) |
| `scripts/build-mcpb.mjs` | Stage + pack bundle |
| `scripts/publish-smithery.mjs` | Publish entry (auth check + deploy) |
| `scripts/smithery-deploy.mjs` | API deploy with complete server card |
| `scripts/smithery-server-card.mjs` | Tool `inputSchema` definitions for Smithery |
| `smithery.yaml` | Legacy/alternate Smithery GitHub config (optional) |
