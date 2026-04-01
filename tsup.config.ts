import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  outDir: "dist",
  format: ["cjs"],
  target: "node18",
  clean: true,
  dts: false,
  sourcemap: true,
});
