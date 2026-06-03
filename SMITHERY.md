# Publishing on Smithery (MCPB bundle)

Per [Smithery publish docs](https://smithery.ai/docs/build/publish#local-mcpb-bundle), stdio servers are published as an **MCPB bundle** (not a hosted MCP URL).

## Prerequisites

- Node.js 18+
- Smithery account: https://smithery.ai
- npm package `@gptscrambler/mcp-server` published (done)

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

Equivalent manual command:

```bash
npx smithery@latest mcp publish ./dist-bundle/server.mcpb -n gptscrambler/mcp-server
```

Optional config schema (same as `smithery.yaml`):

```bash
npx smithery@latest mcp publish ./dist-bundle/server.mcpb -n gptscrambler/mcp-server \
  --config-schema '{"type":"object","required":["gptscramblerApiKey"],"properties":{"gptscramblerApiKey":{"type":"string","title":"GPT Scrambler API Key"},"gptscramblerApiUrl":{"type":"string","default":"https://gptscrambler.com"}}}'
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
| `scripts/publish-smithery.mjs` | Publish to Smithery after login |
| `smithery.yaml` | Legacy/alternate Smithery GitHub config (optional) |
