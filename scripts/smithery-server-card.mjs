/** Tool definitions for Smithery serverCard (MCPB manifest omits inputSchema). */
export const smitheryTools = [
	{
		name: "humanize_text",
		description:
			"Humanize AI-generated text to bypass AI detectors. Returns humanized text, words used, and remaining balance.",
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
						"Language hint (optional, e.g. en, de). Defaults to auto-detect.",
				},
				mode: {
					type: "string",
					enum: ["standard", "aggressive"],
					description:
						"Humanization intensity. standard (default) is faster; aggressive is more natural.",
				},
			},
			required: ["text"],
		},
	},
	{
		name: "get_balance",
		description:
			"Check remaining word balance, plan, and reset date on GPT Scrambler.",
		inputSchema: {
			type: "object",
			properties: {},
			required: [],
		},
	},
];
