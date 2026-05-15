import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/** Vite is pinned to 8.0.12 in package.json (exact, one patch behind 8.0.13) on purpose. */

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools({
      eventBusConfig: {
        port: 42_070,
      },
    }),
    nitro(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
