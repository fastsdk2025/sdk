import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/index.ts"],
	format: "cjs",
	clean: true,
	dts: true,
	target: "es2020",
	platform: "node",
	outDir: "dist",
	banner: {
		js: "!#/usr/bin/env node"
	}
})