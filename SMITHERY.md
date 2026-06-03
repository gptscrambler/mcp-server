# Publishing on Smithery

GPT Scrambler’s MCP server is **stdio + npm** — it runs on the user’s machine and calls `https://gptscrambler.com/api/v1/*`. You do **not** need to host a separate MCP HTTP endpoint for Smithery.

## Two Smithery publish modes

| Mode | Smithery form | What you need |
|------|----------------|---------------|
| **Local (stdio)** ✅ fits us | GitHub repo + `smithery.yaml`, or MCPB bundle | `@gptscrambler/mcp-server` on npm (done) |
| **URL (hosted)** | `https://your-server.com/mcp` | New Streamable HTTP MCP server on your infra |

The screenshot at [smithery.ai/new](https://smithery.ai/new) that asks for **MCP Server URL** is the **hosted** path only.

## Recommended: stdio via GitHub

1. Ensure `smithery.yaml` is in the repo root: [github.com/gptscrambler/mcp-server](https://github.com/gptscrambler/mcp-server)
2. Smithery account → publish flow → connect **GitHub** / paste repo URL (not the URL-only form if offered)
3. Namespace: `gptscrambler` · Server ID: `mcp-server` (or `gpt-scrambler`)
4. Users enter their API key in Smithery’s config UI; Smithery runs:
   `npx -y @gptscrambler/mcp-server` with `GPTSCRAMBLER_API_KEY` set

### CLI alternative (MCPB bundle)

```bash
npm install -g smithery@latest
smithery login
# Build MCPB per Anthropic MCPB spec, then:
smithery mcp publish ./server.mcpb -n gptscrambler/mcp-server
```

See [Smithery publish docs](https://smithery.ai/docs/build/publish).

## Optional later: hosted URL on gptscrambler.com

Only needed if you want Smithery’s **URL** form or remote clients without local `npx`:

1. Add **Streamable HTTP** transport (MCP SDK) at e.g. `https://gptscrambler.com/mcp`
2. Authenticate each session (Bearer API key or OAuth via Smithery Gateway)
3. Reuse the same tool logic as `src/index.ts` (humanize_text, get_balance)
4. Publish: `smithery mcp publish "https://gptscrambler.com/mcp" -n gptscrambler/mcp-server`

This is a separate engineering task (nginx route, rate limits, WAF allow `SmitheryBot/1.0`).

## Other directories

- **mcp.so** — [Submit](https://mcp.so/submit): open source, MIT, npm install snippet, no local file access (we qualify). Optional hosted playground is separate.
- **Official MCP Registry** — `server.json` + `mcpName` in `package.json` (already in repo). See `PUBLISHING.md`.

## Sync `smithery.yaml` to GitHub

```bash
./scripts/export-mcp-server-repo.sh /path/to/mcp-server-clone
cd /path/to/mcp-server-clone && git add smithery.yaml SMITHERY.md && git commit -m "docs: add Smithery stdio config" && git push
```
