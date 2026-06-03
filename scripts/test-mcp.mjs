#!/usr/bin/env node
/**
 * MCP stdio integration test — spawns dist/index.js and exercises tools via JSON-RPC.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "../dist/index.js");

let nextId = 1;

function send(proc, method, params = {}) {
	const id = nextId++;
	const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });
	proc.stdin.write(`${msg}\n`);
	return id;
}

function waitForResponse(rl, expectedId, timeoutMs = 120000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timeout waiting for response id=${expectedId}`));
		}, timeoutMs);

		const onLine = (line) => {
			if (!line.trim()) return;
			let parsed;
			try {
				parsed = JSON.parse(line);
			} catch {
				return;
			}
			if (parsed.id === expectedId) {
				clearTimeout(timer);
				rl.off("line", onLine);
				if (parsed.error) {
					reject(new Error(JSON.stringify(parsed.error)));
				} else {
					resolve(parsed.result);
				}
			}
		};

		rl.on("line", onLine);
	});
}

async function runTests(apiKey, apiUrl) {
	const env = {
		...process.env,
		GPTSCRAMBLER_API_KEY: apiKey,
		GPTSCRAMBLER_API_URL: apiUrl,
	};

	const proc = spawn("node", [SERVER_PATH], { env, stdio: ["pipe", "pipe", "pipe"] });
	const rl = createInterface({ input: proc.stdout });

	let stderr = "";
	proc.stderr.on("data", (chunk) => {
		stderr += chunk.toString();
	});

	const results = [];

	async function test(name, fn) {
		try {
			await fn();
			results.push({ name, ok: true });
			console.log(`✓ ${name}`);
		} catch (err) {
			results.push({ name, ok: false, error: err.message });
			console.log(`✗ ${name}: ${err.message}`);
		}
	}

	await test("initialize", async () => {
		const id = send(proc, "initialize", {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: { name: "mcp-test", version: "1.0.0" },
		});
		const result = await waitForResponse(rl, id, 10000);
		if (!result?.serverInfo?.name) throw new Error("missing serverInfo");
	});

	await test("notifications/initialized", async () => {
		proc.stdin.write(
			`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
		);
	});

	await test("tools/list", async () => {
		const id = send(proc, "tools/list", {});
		const result = await waitForResponse(rl, id, 10000);
		const names = (result?.tools ?? []).map((t) => t.name).sort();
		const expected = ["get_balance", "humanize_text"];
		if (JSON.stringify(names) !== JSON.stringify(expected)) {
			throw new Error(`expected ${expected.join(", ")}, got ${names.join(", ")}`);
		}
	});

	await test("tools/call get_balance", async () => {
		const id = send(proc, "tools/call", { name: "get_balance", arguments: {} });
		const result = await waitForResponse(rl, id, 30000);
		const text = result?.content?.[0]?.text ?? "";
		if (!text.includes("Balance:")) throw new Error(`unexpected: ${text}`);
		console.log(`  → ${text.split("\n")[0]}`);
	});

	await test("tools/call humanize_text", async () => {
		const text =
			"Artificial intelligence is revolutionizing the way businesses operate in the modern world. Companies across various industries are implementing machine learning algorithms to improve their decision-making processes and customer experiences.";
		const id = send(proc, "tools/call", {
			name: "humanize_text",
			arguments: { text, mode: "standard" },
		});
		const result = await waitForResponse(rl, id, 120000);
		if (result?.isError) {
			throw new Error(result.content?.[0]?.text ?? "humanize failed");
		}
		const humanized = result?.content?.[0]?.text ?? "";
		if (humanized.length < 20) throw new Error("humanized text too short");
		console.log(`  → ${humanized.slice(0, 80)}...`);
	});

	await test("tools/call humanize_text (too short)", async () => {
		const id = send(proc, "tools/call", {
			name: "humanize_text",
			arguments: { text: "Too short." },
		});
		const result = await waitForResponse(rl, id, 10000);
		if (!result?.isError) throw new Error("expected isError for short text");
		const msg = result.content?.[0]?.text ?? "";
		if (!msg.includes("too short")) throw new Error(`unexpected: ${msg}`);
	});

	proc.kill();
	rl.close();

	const failed = results.filter((r) => !r.ok);
	console.log("\n---");
	console.log(`Passed: ${results.length - failed.length}/${results.length}`);
	if (stderr.trim()) {
		console.log("Server stderr:", stderr.trim());
	}
	if (failed.length) {
		process.exit(1);
	}
}

const apiKey = process.env.GPTSCRAMBLER_API_KEY;
const apiUrl = process.env.GPTSCRAMBLER_API_URL ?? "http://localhost:3001";

if (!apiKey) {
	console.error("Set GPTSCRAMBLER_API_KEY");
	process.exit(1);
}

runTests(apiKey, apiUrl).catch((err) => {
	console.error(err);
	process.exit(1);
});
