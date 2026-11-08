// @ts-check
import tsParser from "@typescript-eslint/parser";
import tailwindcss from "eslint-plugin-better-tailwindcss";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [
      "dist/**",
      ".output/**",
      ".nitro/**",
      ".tanstack/**",
      "src/routeTree.gen.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    extends: [
      tailwindcss.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "./src/style.css",
      },
    },
    rules: {
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
  },
);
