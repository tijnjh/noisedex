import tailwindcss from "@tailwindcss/vite";
import { plugin as effectUiServer } from "@effect/ui/html/HtmlServerVite";
import { DevToolsVite } from "@effect/ui-devtools/node";
import { defineConfig } from "vite-plus";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    // renders pages on the server in `vite dev`. a build is ours: the client, then the node server
    ...(command === "serve" ? [effectUiServer({ entry: "/src/entry.server.ts" })] : []),
    // dev only: the inspector overlay in the page, and an MCP server for agents at
    // http://127.0.0.1:4774/mcp
    DevToolsVite.plugin(),
  ],

  ssr: {
    noExternal: true,
    external: ["cheerio", "node-vibrant", "node-vibrant/node"],
  },

  builder: {},
  environments: {
    client: {
      build: { outDir: ".output/public", emptyOutDir: true },
    },
    ssr: {
      build: {
        outDir: ".output/server",
        emptyOutDir: true,
        copyPublicDir: false,
        rolldownOptions: {
          input: "src/server/node.ts",
          output: { entryFileNames: "index.mjs" },
        },
      },
    },
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
        // class names are written in `.class(...)` calls
        callees: ["class"],
      },
    },
    ignorePatterns: ["dist/**", ".output/**"],
    overrides: [
      {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
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
        },
        jsPlugins: ["eslint-plugin-better-tailwindcss"],
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
    ignorePatterns: ["pnpm-lock.yaml", "src/data/**"],
  },
}));
