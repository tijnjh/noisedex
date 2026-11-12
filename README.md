# noisedex

music explorer client thingy

uses both the spotify and itunes api for some things

initially started as a better version of everynoise.com, like a music genre explorer, but added some more stuff on top

NOT VIBECODED -- 100% human slop

yes i know it looks like shit

probably buggy too

### stack

- react with tanstack redact
- tanstack start
- jotai
- tanstack virtual

### development

- `pnpm install`
- `pnpm dev` — start the Vite+ development server
- `pnpm check` — check formatting, lint rules, and types
- `pnpm fmt` — format with Oxfmt
- `pnpm lint` — lint with Oxlint
- `pnpm typecheck` — run the standalone TypeScript check
- `pnpm build` — build with Vite+
- `node .output/server/index.mjs` — run the production server

Tooling is configured in `vite.config.ts`. With the global Vite+ CLI installed,
you can also use `vp install`, `vp dev`, `vp check`, and `vp build` directly.
