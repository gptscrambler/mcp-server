# Development (maintainers)

The canonical architecture and sync guide lives in the **monorepo**:

**[docs/mcp-server.md](../../docs/mcp-server.md)**

## Quick commands

```bash
npm ci && npm run build
GPTSCRAMBLER_API_KEY=sk_live_... npm run test:mcp
npm run build:mcpb
npm run publish:smithery   # after: npx smithery@latest auth login
```

## Sync standalone repo

From monorepo root:

```bash
./scripts/export-mcp-server-repo.sh /path/to/mcp-server-clone
```

See [MONOREPO.md](./MONOREPO.md) and [docs/mcp-server.md](../../docs/mcp-server.md).
