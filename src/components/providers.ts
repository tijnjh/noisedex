import { OpenPopover, PlaybackTrack } from "#domain/playback";
import { Preferences, SavePlayOnHover } from "#services/Preferences";
import { Component, Mount, Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Effect, Schema, Stream } from "effect";

// ---------------------------------------------------------------------------
// what plays, for the whole app
// ---------------------------------------------------------------------------

export const NowPlayingMessage = UiSchema.TaggedEnum({
  StartedTrack: { track: PlaybackTrack },
  // stops the track at `url`, or whatever plays without one
  StoppedTrack: { url: Schema.optional(Schema.String) },
  EndedTrack: {},
});

const NowPlayingModel = Schema.Struct({
  track: Schema.NullOr(PlaybackTrack),
  // the navigation it started on: once the page changes, it stops
  navigation: Schema.Number,
});

const playing = (model: typeof NowPlayingModel.Type, navigation: number) =>
  model.navigation === navigation ? model.track : null;

const AudioEnded = Mount.makeStream("AudioEnded", {}, (audio: HTMLAudioElement) =>
  Stream.fromEventListener(audio, "ended").pipe(Stream.as(NowPlayingMessage.EndedTrack())),
);

export const NowPlaying = Html.component({
  name: "NowPlaying",
  props: Schema.Struct({ navigation: Schema.optional(Schema.Number) }),
  model: NowPlayingModel,
  message: NowPlayingMessage,
  shares: {
    value: ({ model, props }) => ({ track: playing(model, props.navigation ?? 0) }),
    receives: ["StartedTrack", "StoppedTrack"],
  },
  restore: false,
}).make({
  init: ($) => ({ track: null, navigation: $.props.navigation ?? 0 }),
  update: ($, message) => {
    const current = playing($.model, $.props.navigation ?? 0);

    return NowPlayingMessage.match(message, {
      StartedTrack: ({ track }) => ({ track, navigation: $.props.navigation ?? 0 }),
      StoppedTrack: ({ url }) =>
        url === undefined || current?.url === url ? { ...$.model, track: null } : $.model,
      EndedTrack: () => ({ ...$.model, track: null }),
    });
  },
  parts: (p, model) => ({
    track: playing(model, p.props.navigation ?? 0),
    // the consumer draws the <audio> for `track`
    audio: p.part("audio", (audio) => audio.onMount(AudioEnded({}))),
  }),
});

// ---------------------------------------------------------------------------
// the "play on hover" setting
// ---------------------------------------------------------------------------

export const PlayOnHoverMessage = UiSchema.TaggedEnum({
  ToggledPlayOnHover: { checked: Schema.Boolean },
  LoadedPlayOnHover: { checked: Schema.Boolean },
});

// stored in the browser, so the server renders it off
export const PlayOnHover = Html.component({
  name: "PlayOnHover",
  model: Schema.Boolean,
  message: PlayOnHoverMessage,
  shares: {
    value: ({ model }) => ({ enabled: model }),
    receives: ["ToggledPlayOnHover"],
  },
  restore: false,
}).make({
  init: () => false,
  update: ($, message) =>
    PlayOnHoverMessage.match(message, {
      ToggledPlayOnHover: ({ checked }) =>
        $.set(checked).run(SavePlayOnHover.make({ value: checked })),
      LoadedPlayOnHover: ({ checked }) => checked,
    }),
  subscriptions: () => [
    Subscription.make(
      "stored",
      Stream.unwrap(
        Effect.gen(function* () {
          const preferences = yield* Preferences;
          return preferences.playOnHover.pipe(
            Stream.map((checked) => PlayOnHoverMessage.LoadedPlayOnHover({ checked })),
          );
        }),
      ),
    ),
  ],
});

// ---------------------------------------------------------------------------
// popovers, drawn at the root from what the components below report
// ---------------------------------------------------------------------------

export const PopoversMessage = UiSchema.TaggedEnum({
  ChangedPopovers: { open: Schema.Array(OpenPopover) },
});

export const Popovers = Html.component({
  name: "Popovers",
  model: Schema.Array(OpenPopover),
  message: PopoversMessage,
  shares: {
    value: () => ({}),
    collects: {
      schema: Schema.NullOr(OpenPopover),
      onChange: (reports) =>
        PopoversMessage.ChangedPopovers({
          open: reports.filter((report): report is OpenPopover => report !== null),
        }),
    },
  },
  restore: false,
}).make({
  init: () => [],
  update: (_, { open }) => open,
  parts: (_, open) => ({ open }),
});

// a popover's anchor-name, from its owner's instance id
export const anchorName = (id: string) => `--popover-${id.replace(/[^\w-]/g, "")}`;

// ---------------------------------------------------------------------------
// the current page's accent colors
// ---------------------------------------------------------------------------

export const PageAccent = Schema.Struct({
  color: Schema.optional(Schema.String),
  background: Schema.optional(Schema.String),
  middle: Schema.optional(Schema.String),
  // album and track pages use their artwork as the favicon
  artwork: Schema.optional(Schema.String),
});
export type PageAccent = typeof PageAccent.Type;

export const AccentMessage = UiSchema.TaggedEnum({
  ChangedAccent: { accent: PageAccent },
});

export const Accent = Html.component({
  name: "Accent",
  model: PageAccent,
  message: AccentMessage,
  shares: {
    value: () => ({}),
    collects: {
      schema: PageAccent,
      // there's one page, so one report
      onChange: (reports) => AccentMessage.ChangedAccent({ accent: reports[0] ?? {} }),
    },
  },
  restore: false,
}).make({
  init: () => ({}),
  update: (_, { accent }) => accent,
  parts: (_, accent) => accent,
});

// the plain page background behind the accent gradients is the body's, so it's set on it
export const BodyBackground = Mount.make(
  "BodyBackground",
  { args: { background: Schema.optional(Schema.String) } },
  (_node: HTMLElement, _args, changes) =>
    Stream.runForEach(changes, ({ background }) =>
      Effect.sync(() => {
        if (background) document.body.style.setProperty("--page-background", background);
        else document.body.style.removeProperty("--page-background");
      }),
    ).pipe(Effect.as(Component.noop)),
);

// the browser's theme-color, tinted with the page's accent color. HtmlHead's meta tags take no
// `media`, so the light and dark defaults are kept here
export const ThemeColor = Mount.make(
  "ThemeColor",
  { args: { color: Schema.optional(Schema.String) } },
  (_node: HTMLElement, _args, changes) =>
    Stream.runForEach(changes, ({ color }) =>
      Effect.sync(() => {
        for (const meta of document.head.querySelectorAll('meta[name="theme-color"]'))
          meta.remove();

        const metas = color
          ? [{ content: color }]
          : [
              { media: "(prefers-color-scheme: light)", content: "#e4e4e7" },
              { media: "(prefers-color-scheme: dark)", content: "#27272a" },
            ];

        for (const { media, content } of metas as { media?: string; content: string }[]) {
          const meta = document.createElement("meta");
          meta.name = "theme-color";
          if (media) meta.media = media;
          meta.content = content;
          document.head.append(meta);
        }
      }),
    ).pipe(Effect.as(Component.noop)),
);
