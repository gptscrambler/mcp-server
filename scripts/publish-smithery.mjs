#!/usr/bin/env node
/**
 * Publish MCPB bundle to Smithery (requires: smithery auth login).
 *
 * Usage:
 *   npm run build:mcpb
 *   npm run publish:smithery
 *
 * Or with namespace/server name override:
 *   SMITHERY_SERVER_NAME=gptscrambler/mcp-server npm run publish:smithery
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bundle = join(root, "dist-bundle", "server.mcpb");
const serverName = process.env.SMITHERY_SERVER_NAME ?? "gptscrambler/mcp-server";

if (!existsSync(bundle)) {
	console.error(`Bundle not found: ${bundle}\nRun: npm run build:mcpb`);
	process.exit(1);
}

function run(args) {
	const result = spawnSync("npx", ["smithery@latest", ...args], {
		stdio: "inherit",
		cwd: root,
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log("→ smithery auth whoami");
const whoami = spawnSync("npx", ["smithery@latest", "auth", "whoami"], {
	cwd: root,
	encoding: "utf8",
});
if (whoami.status !== 0) {
	console.error("\nNot logged in. Run:\n  npx smithery@latest auth login\n");
	console.error("Then open the auth_url in your browser and complete sign-in.\n");
	process.exit(1);
}

console.log(`→ smithery mcp publish ${bundle} -n ${serverName}`);
run(["mcp", "publish", bundle, "-n", serverName]);

console.log("\n✓ Published to Smithery");
