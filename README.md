# noisedex

music explorer client thingy

a genre-centric music discovery platform, that unifies data from multiple sources

initially started as a better version of everynoise.com, but added some more stuff on top

NOT VIBECODED -- 100% human slop

[noisedex.com](https://noisedex.com)

## data sources

- [every noise at once](https://everynoise.com), via [everynoise-json](https://github.com/tijnjh/everynoise-json) on jsdelivr - genres, related genres, artist mappings and previews
- [itunes](https://www.apple.com/itunes/) — search, artist discographies, albums, tracks, artwork and audio previews
- [spotify](https://open.spotify.com) - artist lookup and metadata, plus embedded playback
- [wikipedia](https://en.wikipedia.org) - artist and album descriptions, genre context
- [soundcloud](https://soundcloud.com) - matched album tracks for playback when available
- [the needle drop](https://theneedledrop.com) - review links from a locally stored index

last.fm, bandcamp, AOTY and RYM are linked, not data sources

## stack

react, tanstack start, jotai, tailwindcss and vite+

## development

```sh
pnpm install
pnpm dev
```

`pnpm check` checks formatting, lint and types `pnpm build` builds for production;
`node .output/server/index.mjs` starts the server.
