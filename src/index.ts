#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version: SERVER_VERSION } = JSON.parse(
	readFileSync(join(__dirname, "../package.json"), "utf8"),
) as { version: string };

const API_BASE_URL = process.env.GPTSCRAMBLER_API_URL ?? "https://gptscrambler.com";
const API_KEY = process.env.GPTSCRAMBLER_API_KEY ?? "";

if (!API_KEY) {
	process.stderr.write(
		"[gpt-scrambler] Error: GPTSCRAMBLER_API_KEY environment variable is required.\n" +
			"Get your API key at https://gptscrambler.com/app/settings/api-access\n",
	);
	process.exit(1);
}

const server = new Server(
	{
		name: "gpt-scrambler",
		version: SERVER_VERSION,
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

async function parseApiJson(response: Response): Promise<Record<string, unknown>> {
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		const text = await response.text();
		throw new Error(
			text.slice(0, 200) || `Unexpected response (${response.status})`,
		);
	}
	return (await response.json()) as Record<string, unknown>;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "humanize_text",
				description:
					"Humanize AI-generated text to bypass AI detectors (Turnitin, GPTZero, Copyleaks). Returns the humanized text along with words used and remaining balance.",
				inputSchema: {
					type: "object",
					properties: {
						text: {
							type: "string",
							description: "The AI-generated text to humanize (10–3,000 words).",
						},
						language: {
							type: "string",
							description:
								"Language hint (optional, e.g. 'en', 'de'). Defaults to auto-detect.",
						},
						mode: {
							type: "string",
							enum: ["standard", "aggressive"],
							description:
								"Humanization intensity. 'standard' (default) is faster; 'aggressive' produces more natural-sounding results.",
						},
					},
					required: ["text"],
				},
			},
			{
				name: "get_balance",
				description: "Check your remaining word balance on GPT Scrambler.",
				inputSchema: {
					type: "object",
					properties: {},
					required: [],
				},
			},
		],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	try {
		if (name === "humanize_text") {
			const { text, language, mode } = (args ?? {}) as {
				text?: string;
				language?: string;
				mode?: "standard" | "aggressive";
			};

			if (!text || typeof text !== "string") {
				return {
					content: [
						{
							type: "text",
							text: "Error: 'text' parameter is required and must be a string.",
						},
					],
					isError: true,
				};
			}

			const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
			if (wordCount < 10) {
				return {
					content: [
						{
							type: "text",
							text: `Error: Text is too short. Minimum 10 words required, got ${wordCount}.`,
						},
					],
					isError: true,
				};
			}
			if (wordCount > 3000) {
				return {
					content: [
						{
							type: "text",
							text: `Error: Text exceeds the maximum of 3,000 words per request. Got ${wordCount} words. Please split your text into smaller chunks.`,
						},
					],
					isError: true,
				};
			}

			const body: Record<string, string> = { text };
			if (language) body.language = language;
			if (mode) body.mode = mode;

			const response = await fetch(`${API_BASE_URL}/api/v1/humanize`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const data = await parseApiJson(response);

			if (!response.ok) {
				const errorCode = (data.error as string) ?? "error";
				const message = (data.message as string) ?? "Unknown error";

				if (errorCode === "insufficient_balance" || response.status === 402) {
					const balance = data.balance_remaining ?? 0;
					const required = data.words_required ?? wordCount;
					return {
						content: [
							{
								type: "text",
								text: `Not enough words. Balance: ${balance} words, required: ${required}. Top up at ${API_BASE_URL}/en/pricing`,
							},
						],
						isError: true,
					};
				}

				if (errorCode === "trial_exhausted" || response.status === 403) {
					return {
						content: [
							{
								type: "text",
								text: `Free trial exhausted. Upgrade to the API Plan for 100,000 words/month at ${API_BASE_URL}/en/pricing`,
							},
						],
						isError: true,
					};
				}

				return {
					content: [
						{ type: "text", text: `Error (${response.status}): ${message}` },
					],
					isError: true,
				};
			}

			const humanizedText = data.humanized_text as string;
			const wordsUsed = data.words_used as number;
			const balanceRemaining = data.balance_remaining as number;

			return {
				content: [
					{
						type: "text",
						text: humanizedText,
					},
					{
						type: "text",
						text: `\n---\nWords used: ${wordsUsed} | Balance remaining: ${balanceRemaining} words`,
					},
				],
			};
		}

		if (name === "get_balance") {
			const response = await fetch(`${API_BASE_URL}/api/v1/balance`, {
				headers: {
					Authorization: `Bearer ${API_KEY}`,
				},
			});

			const data = await parseApiJson(response);

			if (!response.ok) {
				const message = (data.message as string) ?? "Unknown error";
				return {
					content: [
						{ type: "text", text: `Error (${response.status}): ${message}` },
					],
					isError: true,
				};
			}

			const balance = data.balance_remaining as number;
			const plan = data.plan as string;
			const resetDate = data.reset_date as string | null;

			return {
				content: [
					{
						type: "text",
						text: [
							`Balance: ${balance} words remaining`,
							`Plan: ${plan}`,
							resetDate ? `Resets: ${resetDate}` : null,
						]
							.filter(Boolean)
							.join("\n"),
					},
				],
			};
		}

		return {
			content: [{ type: "text", text: `Unknown tool: ${name}` }],
			isError: true,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			content: [
				{
					type: "text",
					text: `Request failed: ${message}`,
				},
			],
			isError: true,
		};
	}
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	process.stderr.write("[gpt-scrambler] MCP server running on stdio\n");
}

main().catch((err: unknown) => {
	process.stderr.write(`[gpt-scrambler] Fatal error: ${err}\n`);
	process.exit(1);
});
