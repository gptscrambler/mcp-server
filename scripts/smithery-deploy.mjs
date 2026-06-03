#!/usr/bin/env node
/**
 * Deploy MCPB to Smithery with a complete serverCard (tool inputSchemas).
 * Workaround: smithery CLI + MCPB manifest without inputSchema → API 400.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { smitheryTools } from "./smithery-server-card.mjs";

const API_BASE = "https://api.smithery.ai";

function loadApiKey() {
	if (process.env.SMITHERY_API_KEY) {
		return process.env.SMITHERY_API_KEY;
	}
	const settingsPath =
		process.env.SMITHERY_CONFIG_PATH ??
		join(homedir(), ".config", "smithery", "settings.json");
	if (!existsSync(settingsPath)) {
		throw new Error(
			`Smithery not configured. Run: npx smithery@latest auth login\nOr set SMITHERY_API_KEY.`,
		);
	}
	const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
	if (!settings.apiKey) {
		throw new Error("No apiKey in Smithery settings. Run: npx smithery@latest auth login");
	}
	return settings.apiKey;
}

function userConfigToJsonSchema(userConfig) {
	if (!userConfig || Object.keys(userConfig).length === 0) {
		return undefined;
	}
	const schema = { type: "object", properties: {}, required: [] };
	for (const [key, field] of Object.entries(userConfig)) {
		schema.properties[key] = {
			type: field.type === "directory" || field.type === "file" ? "string" : field.type,
			...(field.title ? { title: field.title } : {}),
			...(field.description ? { description: field.description } : {}),
			...(field.default !== undefined ? { default: field.default } : {}),
		};
		if (field.required) {
			schema.required.push(key);
		}
	}
	if (schema.required.length === 0) {
		delete schema.required;
	}
	return schema;
}

function readManifestFromBundle(bundlePath) {
	const stageManifest = join(dirname(bundlePath), "stage", "manifest.json");
	if (existsSync(stageManifest)) {
		return JSON.parse(readFileSync(stageManifest, "utf8"));
	}
	const result = spawnSync("unzip", ["-p", bundlePath, "manifest.json"], {
		encoding: "utf8",
	});
	if (result.status !== 0 || !result.stdout?.trim()) {
		throw new Error("Bundle manifest.json not found at archive root");
	}
	return JSON.parse(result.stdout);
}

function parseBundle(bundlePath) {
	const manifest = readManifestFromBundle(bundlePath);
	if (!manifest.name || !manifest.version) {
		throw new Error("Bundle manifest must include name and version");
	}
	let runtime = "node";
	if (manifest.server?.type === "python") {
		runtime = "python";
	} else if (manifest.server?.type === "binary") {
		runtime = "binary";
	}
	return { manifest, runtime };
}

function buildPayload(manifest, runtime) {
	const configSchema = userConfigToJsonSchema(manifest.user_config);
	return {
		type: "stdio",
		runtime,
		serverCard: {
			serverInfo: {
				name: manifest.name,
				version: manifest.version,
			},
			tools: smitheryTools,
			resources: [],
			prompts: [],
		},
		...(configSchema ? { configSchema } : {}),
	};
}

async function ensureServer(apiKey, qualifiedName) {
	const res = await fetch(`${API_BASE}/servers/${qualifiedName}`, {
		headers: { Authorization: `Bearer ${apiKey}` },
	});
	if (res.ok) {
		return;
	}
	if (res.status !== 404) {
		const body = await res.text();
		throw new Error(`Failed to check server (${res.status}): ${body}`);
	}
	const create = await fetch(`${API_BASE}/servers/${qualifiedName}`, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({}),
	});
	if (!create.ok) {
		const body = await create.text();
		throw new Error(`Failed to create server (${create.status}): ${body}`);
	}
	console.log(`✓ Created server "${qualifiedName}"`);
}

async function deployRelease(apiKey, qualifiedName, bundlePath, payload) {
	const form = new FormData();
	form.append("payload", JSON.stringify(payload));
	form.append("bundle", new Blob([readFileSync(bundlePath)]), "server.mcpb");

	const res = await fetch(`${API_BASE}/servers/${qualifiedName}/releases`, {
		method: "PUT",
		headers: { Authorization: `Bearer ${apiKey}` },
		body: form,
	});

	const body = await res.text();
	if (!res.ok) {
		throw new Error(`Deployment failed: ${res.status} ${body}`);
	}
	return JSON.parse(body);
}

export async function deploySmitheryBundle(bundlePath, qualifiedName) {
	const apiKey = loadApiKey();
	const { manifest, runtime } = parseBundle(bundlePath);
	const payload = buildPayload(manifest, runtime);

	console.log(`Publishing ${qualifiedName} (stdio) to Smithery Registry...`);
	await ensureServer(apiKey, qualifiedName);

	const result = await deployRelease(apiKey, qualifiedName, bundlePath, payload);
	console.log(`✓ Release ${result.deploymentId} accepted`);
	if (result.mcpUrl) {
		console.log(`  MCP URL: ${result.mcpUrl}`);
	}
	console.log(`  Server: https://smithery.ai/servers/${qualifiedName}`);
	return result;
}
