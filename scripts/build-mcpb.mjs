#!/usr/bin/env node
/**
 * Build MCPB bundle for Smithery publish.
 * Output: packages/mcp-server/dist-bundle/server.mcpb
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const stage = join(root, "dist-bundle", "stage");
const mcpbOut = join(root, "dist-bundle", "server.mcpb");
const mcpbBin = join(root, "node_modules", ".bin", "mcpb");

function run(cmd, args, cwd = root) {
	const result = spawnSync(cmd, args, { stdio: "inherit", cwd });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

function copyBundleFiles() {
	rmSync(stage, { recursive: true, force: true });
	mkdirSync(stage, { recursive: true });

	const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
	const prodPkg = {
		name: pkg.name,
		version: pkg.version,
		type: pkg.type,
		main: pkg.main,
		license: pkg.license,
		dependencies: pkg.dependencies,
	};

	writeFileSync(join(stage, "package.json"), `${JSON.stringify(prodPkg, null, 2)}\n`);
	copyFileSync(join(root, "manifest.json"), join(stage, "manifest.json"));
	copyFileSync(join(root, "LICENSE"), join(stage, "LICENSE"));
	cpSync(join(root, "dist"), join(stage, "dist"), { recursive: true });
}

console.log("→ npm ci (dev tools)");
run("npm", ["ci"]);

console.log("→ npm run build");
run("npm", ["run", "build"]);

console.log("→ stage bundle files");
copyBundleFiles();

console.log("→ npm install --omit=dev (staged production deps)");
run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], stage);

console.log("→ mcpb validate");
run(mcpbBin, ["validate", "manifest.json"], stage);

console.log("→ mcpb pack");
if (existsSync(mcpbOut)) {
	rmSync(mcpbOut);
}
mkdirSync(dirname(mcpbOut), { recursive: true });
run(mcpbBin, ["pack", stage, mcpbOut]);

console.log("→ mcpb info");
run(mcpbBin, ["info", mcpbOut]);

console.log(`\n✓ Bundle ready: ${mcpbOut}`);
