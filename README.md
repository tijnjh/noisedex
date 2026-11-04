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
- tanstack query
- jotai
- tanstack virtual

### development

- `pnpm install`
- `pnpm dev`
- `pnpm typecheck`
- `pnpm build`
- `node .output/server/index.mjs` — run the production server

The React/Redact rewrite uses commit `5b4d277` as a reference while retaining
the later routes, layout, metadata, and SoundCloud playback. React imports are
redirected to Redact by its Vite plugin on both the client and server. SSR
dependencies are bundled so they use the same runtime. Playback uses an
app-scoped Jotai provider; genre filtering and sorting stay in the URL.
