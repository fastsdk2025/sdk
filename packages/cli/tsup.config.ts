import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "cjs",
  target: "es2020",
  platform: "node",
  dts: true,
  clean: true,
  outDir: "dist",
});
