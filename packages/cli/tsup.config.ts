import { defineConfig } from "tsup";
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
  format: "cjs",
  target: "es2020",
  platform: "node",
  dts: true,
  clean: true,
  outDir: "dist",
  esbuildOptions(options) {
    options.alias = aliases
  }
});
