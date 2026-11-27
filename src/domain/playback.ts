import { Schema } from "effect";

export const PlaybackTrack = Schema.Struct({
  title: Schema.optional(Schema.String),
  artist: Schema.optional(Schema.String),
  artworkSrc: Schema.optional(Schema.String),
  url: Schema.optional(Schema.String),
});
export type PlaybackTrack = typeof PlaybackTrack.Type;

// a play button next to a page's title, with what its popover says
export const TitlePlayback = Schema.Struct({
  track: PlaybackTrack,
  note: Schema.optional(Schema.String),
});
export type TitlePlayback = typeof TitlePlayback.Type;

// what a popover shows: the content is data, so the popover layer at the root can draw it
export const PopoverContent = Schema.TaggedUnion({
  TrackCard: {
    track: PlaybackTrack,
    note: Schema.optional(Schema.String),
    // shown with a speaker while it plays, as a skeleton while it loads
    playing: Schema.optional(Schema.Literals(["loading", "playing"])),
  },
  SortHint: { current: Schema.String, next: Schema.String },
});
export type PopoverContent = typeof PopoverContent.Type;

export const OpenPopover = Schema.Struct({
  anchor: Schema.String,
  // above on touch, so the thumb doesn't cover it
  touch: Schema.Boolean,
  content: PopoverContent,
});
export type OpenPopover = typeof OpenPopover.Type;
