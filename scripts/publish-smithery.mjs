#!/usr/bin/env node
/**
 * Publish MCPB bundle to Smithery (requires: smithery auth login).
 *
 * Usage:
 *   npm run build:mcpb
 *   npm run publish:smithery
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deploySmitheryBundle } from "./smithery-deploy.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bundle = join(root, "dist-bundle", "server.mcpb");
const serverName = process.env.SMITHERY_SERVER_NAME ?? "gptscrambler/mcp-server";

if (!existsSync(bundle)) {
	console.error(`Bundle not found: ${bundle}\nRun: npm run build:mcpb`);
	process.exit(1);
}

console.log("→ smithery auth whoami");
const whoami = spawnSync("npx", ["smithery@latest", "auth", "whoami"], {
	cwd: root,
	encoding: "utf8",
});
if (whoami.status !== 0) {
	console.error("\nNot logged in. Run:\n  npx smithery@latest auth login\n");
	process.exit(1);
}

try {
	await deploySmitheryBundle(bundle, serverName);
	console.log("\n✓ Published to Smithery");
} catch (error) {
	console.error(
		error instanceof Error ? error.message : String(error),
	);
	process.exit(1);
}
