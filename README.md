# @gptscrambler/mcp-server

<!-- mcp-name: io.github.gptscrambler/mcp-server -->

MCP server for [GPT Scrambler](https://gptscrambler.com) — humanize AI-generated text directly in Claude Desktop, Cursor, or any MCP-compatible AI agent.

[![npm version](https://img.shields.io/npm/v/@gptscrambler/mcp-server)](https://www.npmjs.com/package/@gptscrambler/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Requirements

- Node.js 18+
- A GPT Scrambler API key ([get one here](https://gptscrambler.com/app/settings/api-access))

## Installation

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

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

Restart Claude Desktop after saving. Cursor usually picks up config changes automatically.

### Smithery

Install from the [Smithery registry](https://smithery.ai/servers/gptscrambler/mcp-server) (stdio MCPB bundle). Configure your GPT Scrambler API key in Smithery’s UI; it is passed as `GPTSCRAMBLER_API_KEY` to the local server.

Maintainers: see [SMITHERY.md](./SMITHERY.md) for `npm run build:mcpb` and `npm run publish:smithery`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GPTSCRAMBLER_API_KEY` | Yes | Bearer API key from [Settings → API Access](https://gptscrambler.com/app/settings/api-access) |
| `GPTSCRAMBLER_API_URL` | No | API base URL (default: `https://gptscrambler.com`) |

## Tools

### `humanize_text`

Humanize AI-generated text to bypass AI detectors (Turnitin, GPTZero, Copyleaks).

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | string | Yes | Text to humanize (10–3,000 words) |
| `language` | string | No | Language hint, e.g. `en`, `de` |
| `mode` | `standard` \| `aggressive` | No | Rewrite strength (default: `standard`) |

### `get_balance`

Returns remaining word balance, plan, and reset date (same as `GET /api/v1/balance`).

## Pricing

- **Free trial**: 200 words for API/MCP only (separate from web balance, one-time)
- **API Plan**: $49.99/month — 100,000 words

[View plans →](https://gptscrambler.com/en/pricing)

## Development

```bash
npm ci
npm run build
GPTSCRAMBLER_API_KEY=sk_live_... GPTSCRAMBLER_API_URL=https://gptscrambler.com npm run test:mcp
```

## Links

- [Website](https://gptscrambler.com)
- [MCP & API docs](https://gptscrambler.com/en/mcp)
- [Smithery](https://smithery.ai/servers/gptscrambler/mcp-server)
- [REST API reference](https://gptscrambler.com/docs/api)
- [Source](https://github.com/gptscrambler/mcp-server)

## License

MIT — see [LICENSE](LICENSE).
