// vp migrate: merged .oxlintrc.json (f9a0359bf2c678094e468b6656b1001e).
import tailwindcss from "@tailwindcss/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { redact } from "@tanstack/redact/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  plugins: lazyPlugins(() => [
    tanstackStart(),
    nitroV2Plugin({ preset: "node-server" }),
    react(),
    redact(),
    tailwindcss(),
  ]),

  ssr: {
    noExternal: true,
    external: ["cheerio", "node-vibrant", "node-vibrant/node"],
  },

  lint: {
    plugins: ["oxc", "typescript", "unicorn"],
    categories: {
      correctness: "warn",
    },
    env: {
      builtin: true,
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "./src/style.css",
      },
    },
    ignorePatterns: ["dist/**", ".output/**", ".nitro/**", ".tanstack/**", "src/routeTree.gen.ts"],
    overrides: [
      {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
        rules: {
          "better-tailwindcss/enforce-consistent-class-order": "warn",
          "better-tailwindcss/enforce-consistent-line-wrapping": "off",
          "better-tailwindcss/no-deprecated-classes": "warn",
          "better-tailwindcss/no-duplicate-classes": "warn",
          "better-tailwindcss/no-unnecessary-whitespace": "warn",
          "better-tailwindcss/enforce-canonical-classes": "warn",
          "better-tailwindcss/no-concatenated-classes": "error",
          "better-tailwindcss/no-conflicting-classes": "error",
          "better-tailwindcss/no-unknown-classes": "error",
          "react/rules-of-hooks": "error",
          "react/exhaustive-deps": "warn",
          "react/static-components": "error",
          "react/use-memo": "error",
          "react/void-use-memo": "error",
          "react/preserve-manual-memoization": "error",
          "react/incompatible-library": "warn",
          "react/immutability": "error",
          "react/globals": "error",
          "react/refs": "error",
          "react/set-state-in-effect": "error",
          "react/error-boundaries": "error",
          "react/purity": "error",
          "react/set-state-in-render": "error",
          "react/unsupported-syntax": "warn",
        },
        jsPlugins: ["eslint-plugin-better-tailwindcss"],
        plugins: ["react"],
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts", "pnpm-lock.yaml"],
  },
});
