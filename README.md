# noisedex

music explorer client thingy

uses Spotify for artist profiles, discographies, album/track metadata, and search.
SoundCloud streams and matched iTunes previews are separate optional playback sources.

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
- `pnpm dev`
- `pnpm typecheck`
- `pnpm build`
- `node .output/server/index.mjs` — run the production server

### catalog and playback

- Spotify releases and tracks use `/album/spotify/:spotifyId` and `/track/spotify/:spotifyId`.
  Existing numeric iTunes URLs remain available for old links.
- Catalog requests use the browser's preferred language region (US fallback), and artist
  discographies and album track lists follow all pages. Search shows up to ten results per type.
- Release dates retain Spotify's precision. Spotify has no EP field, so multi-track singles
  display “Single / EP” unless the title explicitly identifies an EP.
- iTunes previews are matched by album, artist, title, duration, and explicitness. Missing
  audio does not prevent browsing. Spotify preview URLs and the Spotify playback SDK are not used.
- Authentication continues to use the existing Every Noise token helper. An app-owned
  Spotify OAuth client and its deployment quotas remain a separate setup task.
- Run catalog regression tests with `node --test tests/*.test.mjs` (Node 26).
