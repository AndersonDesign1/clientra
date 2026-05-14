import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      pool: "forks",
      teardownTimeout: 30_000,
    },
  })
);
