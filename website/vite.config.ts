import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

// https://vite.dev/config/
const rpcProxyTarget = process.env.VITE_RPC_ORIGIN ?? "http://127.0.0.1:8787";

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: rpcProxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "lib/": `${srcDir}/lib/`,
      "components/": `${srcDir}/components/`,
      "types/": `${srcDir}/types/`,
      "pages/": `${srcDir}/pages/`,
      "contexts/": `${srcDir}/contexts/`,
      "hooks/": `${srcDir}/hooks/`,
    },
  },
});
