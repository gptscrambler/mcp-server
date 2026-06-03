# Publishing `@gptscrambler/mcp-server`

## Prerequisites

1. GitHub repo: https://github.com/gptscrambler/mcp-server (public)
2. npm org: `@gptscrambler` with your npm user added
3. Node.js 18+

## One-time npm login

```bash
npm login
npm access ls-packages @gptscrambler  # verify org access
```

## Publish flow

```bash
cd /path/to/mcp-server   # standalone clone of this package
npm ci
npm run build
npm publish --access public
```

Bump version before each release:

```bash
npm version patch   # or minor / major
# Update server.json "version" and packages[0].version to match package.json
git push && git push --tags
npm publish --access public
```

## MCP Registry (official)

`package.json` includes `mcpName`: `io.github.gptscrambler/mcp-server` (must match `server.json` `name`).

README includes a hidden registry line for PyPI-style verification on other registries; for npm, `mcpName` in `package.json` is sufficient.

Install the publisher CLI and follow: https://modelcontextprotocol.io/registry/publishing

## Smithery (MCPB bundle)

Published server: https://smithery.ai/servers/gptscrambler/mcp-server

```bash
npm run build:mcpb
npx smithery@latest auth login
npm run publish:smithery
```

Use `npm run publish:smithery` (not raw `smithery mcp publish` alone). See [SMITHERY.md](./SMITHERY.md) for Node 20+ notes and HTTP 400 troubleshooting.

## Catalogs (mcp.so, Pulse MCP, etc.)

- Keep repo **public** with MIT `LICENSE`
- README: install snippet, env vars, tools list, link to https://gptscrambler.com/en/mcp
- npm package **public** under `@gptscrambler/mcp-server`
- Server uses **stdio** only (no arbitrary local file access)

## User install (unchanged flow)

```json
{
  "mcpServers": {
    "gpt-scrambler": {
      "command": "npx",
      "args": ["-y", "@gptscrambler/mcp-server"],
      "env": {
        "GPTSCRAMBLER_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```
