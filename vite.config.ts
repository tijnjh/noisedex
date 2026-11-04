import tailwindcss from "@tailwindcss/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { redact } from "@tanstack/redact/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Bundle React consumers so their imports also resolve to Redact during SSR.
  ssr: {
    noExternal: true,
    external: ["papaparse", "domino"],
  },
  plugins: [
    tanstackStart(),
    nitroV2Plugin({ preset: "node-server" }),
    react(),
    redact(),
    tailwindcss(),
  ],
});
