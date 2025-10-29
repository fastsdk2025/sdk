import { defineConfig } from "tsup"
import { compilerOptions } from "./tsconfig.json"
import { resolve } from "node:path";

const paths = compilerOptions.paths
const aliases: Record<string, string> = {}

for (const [key, value] of Object.entries(paths)) {
  const name = key.replace("/*", "")
  const target = value[0].replace("/*", "")

  aliases[name] = resolve(__dirname, target)
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: true,
  target: "es2020",
  outDir: "dist",
  platform: "node",
  esbuildOptions(options) {
    options.alias = aliases
  }
})
