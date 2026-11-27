import {
  anchorName,
  NowPlaying,
  NowPlayingMessage,
  PlayOnHover,
  Popovers,
} from "#components/providers";
import { Skeleton } from "#components/skeleton";
import { PlaybackTrack, type OpenPopover, type PopoverContent } from "#domain/playback";
import { itunesPlayback } from "#lib/playback";
import { Api } from "#services/Api";
import { Command, Mount, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Effect, Queue, Schema, Stream } from "effect";

// ---------------------------------------------------------------------------
// what popovers show
// ---------------------------------------------------------------------------

export const TrackCard = <M>(h: Html.H<M>, track: PlaybackTrack, note?: string) =>
  h.div
    .class("flex flex-col")
    .children(
      note && h.span.class("text-sm opacity-60").children(note),
      h.span.class("font-bold").children(track.title ?? ""),
      track.artist && h.span.children(track.artist),
    );

const SpeakerIcon = <M>(h: Html.H<M>) =>
  h.svg
    .class("size-4")
    .attrs({
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    })
    .children(
      h.path.attr("d", "M11 5 6 9H2v6h4l5 4V5z"),
      h.path.attr("d", "M15.54 8.46a5 5 0 0 1 0 7.07"),
    );

export const PopoverBody = <M>(h: Html.H<M>, content: PopoverContent) => {
  if (content._tag === "SortHint") {
    return h.p.children(`sorted by ${content.current}. click to sort by ${content.next}.`);
  }

  const card = TrackCard(h, content.track, content.note);
  if (!content.playing) return card;

  return Skeleton(h, {
    loading: content.playing === "loading",
    label: "Loading track",
    children: [
      h.div
        .class("flex items-start gap-2")
        .children(
          h.span
            .class("flex h-lh shrink-0 items-center")
            .attr("aria-label", "playing")
            .children(SpeakerIcon(h)),
          card,
        ),
    ],
  });
};

// the popovers open below the components, drawn in the top layer at the root
export const PopoverLayer = <M>(h: Html.H<M>, open: ReadonlyArray<OpenPopover>) =>
  open.map(({ anchor, touch, content }) =>
    h.div
      .key(anchor)
      .attr("data-popover", "")
      .popover("manual", true)
      .class(touch ? "surface absolute" : "surface absolute pointer-coarse:hidden")
      .attr(
        "style",
        `position-anchor: ${anchor}; ${touch ? "bottom: anchor(top)" : "top: anchor(bottom)"}; left: anchor(left); position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`,
      )
      .children(
        h.div
          .class("flex w-72 flex-col gap-3 p-3 wrap-break-word")
          .children(PopoverBody(h, content)),
      ),
  );

// ---------------------------------------------------------------------------
// hover to play
// ---------------------------------------------------------------------------

const HoverPlayLoad = Schema.TaggedUnion({
  Track: { track: PlaybackTrack },
  // an album plays its first track, looked up once it's hovered
  FirstTrackOf: { albumId: Schema.Number },
});

const HoverPlayCard = Schema.TaggedUnion({
  // the popover names the track whenever the chip is hovered or focused
  Always: { track: PlaybackTrack, note: Schema.optional(Schema.String) },
  // the popover only shows while the track plays
  WhilePlaying: { note: Schema.optional(Schema.String) },
});

export const HoverPlayProps = Schema.Struct({
  load: HoverPlayLoad,
  card: Schema.optional(HoverPlayCard),
});
export type HoverPlayProps = typeof HoverPlayProps.Type;

const HoverPlayModel = Schema.Struct({
  // the hover in progress, so a track that loads after the pointer left never starts
  generation: Schema.Number,
  status: Schema.Literals(["idle", "loading", "playing"]),
  playing: Schema.NullOr(PlaybackTrack),
  popover: Schema.Literals(["closed", "open", "touch"]),
});
type HoverPlayModel = typeof HoverPlayModel.Type;

export const HoverPlayMessage = UiSchema.TaggedEnum({
  EnteredWithMouse: {},
  LeftWithMouse: {},
  HeldDown: {},
  ReleasedHold: {},
  OpenedPopover: {},
  ClosedPopover: {},
  LoadedFirstTrack: { generation: Schema.Number, track: Schema.NullOr(PlaybackTrack) },
});

const firstTracks = new Map<number, Promise<PlaybackTrack | null>>();

export class LoadFirstTrack extends Command.Service<LoadFirstTrack>()("itunes/LoadFirstTrack", {
  args: { albumId: Schema.Number, generation: Schema.Number },
  success: HoverPlayMessage,
}) {
  static readonly layer = this.toLayer(
    Effect.gen(function* () {
      const api = yield* Api;

      const load = (albumId: number) =>
        api.music(albumId).pipe(
          Effect.map((music) =>
            music?.type === "album" && music.tracks[0] ? itunesPlayback(music.tracks[0]) : null,
          ),
          Effect.orElseSucceed(() => null),
        );

      return ({ albumId, generation }) =>
        Effect.promise(() => {
          let first = firstTracks.get(albumId);
          if (!first) {
            first = Effect.runPromise(load(albumId));
            firstTracks.set(albumId, first);
          }
          return first;
        }).pipe(Effect.map((track) => HoverPlayMessage.LoadedFirstTrack({ generation, track })));
    }),
  );
}

// plays on mouse hover (if enabled) or touch hold, and keeps releasing a hold from clicking through
const HoverPlayGestures = Mount.makeStream("HoverPlayGestures", {}, (element: HTMLElement) =>
  Stream.callback<typeof HoverPlayMessage.Type>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const emit = (message: typeof HoverPlayMessage.Type) => Queue.offerUnsafe(queue, message);
        let hold: { timer?: ReturnType<typeof setTimeout>; held?: boolean } | undefined;

        const release = () => {
          clearTimeout(hold?.timer);
          if (hold?.held) emit(HoverPlayMessage.ReleasedHold());
          else hold = undefined;
        };

        const listeners: [string, (event: never) => void, boolean?][] = [
          [
            "pointerenter",
            (event: PointerEvent) => {
              if (event.pointerType === "mouse") emit(HoverPlayMessage.EnteredWithMouse());
            },
          ],
          [
            "pointerleave",
            (event: PointerEvent) => {
              if (event.pointerType === "mouse") emit(HoverPlayMessage.LeftWithMouse());
            },
          ],
          [
            "pointerdown",
            (event: PointerEvent) => {
              if (event.pointerType === "mouse") return;
              const current: NonNullable<typeof hold> = (hold = {});
              current.timer = setTimeout(() => {
                current.held = true;
                emit(HoverPlayMessage.HeldDown());
              }, 300);
            },
          ],
          ["pointerup", release],
          ["pointercancel", release],
          [
            "contextmenu",
            (event: MouseEvent) => {
              if (hold?.held) event.preventDefault();
            },
          ],
          [
            "click",
            (event: MouseEvent) => {
              if (!hold?.held) return;
              event.preventDefault();
              event.stopPropagation();
              hold = undefined;
            },
            true,
          ],
        ];

        for (const [type, listener, capture] of listeners) {
          element.addEventListener(type, listener as EventListener, capture);
        }

        return () => {
          clearTimeout(hold?.timer);
          for (const [type, listener, capture] of listeners) {
            element.removeEventListener(type, listener as EventListener, capture);
          }
        };
      }),
      (cleanup) => Effect.sync(cleanup),
    ).pipe(Effect.andThen(Effect.never)),
  ),
);

const sampleTrack: PlaybackTrack = { title: "A track title", artist: "An artist" };

function popoverContent(props: HoverPlayProps, model: HoverPlayModel): PopoverContent | null {
  const { card } = props;
  const active = model.status !== "idle";
  const playing = active ? (model.status === "loading" ? "loading" : "playing") : undefined;

  if (card?._tag === "Always") {
    return { _tag: "TrackCard", track: card.track, note: card.note, playing };
  }
  if (card?._tag === "WhilePlaying" && active) {
    return { _tag: "TrackCard", track: model.playing ?? sampleTrack, note: card.note, playing };
  }
  return null;
}

// a headless part for the element that plays: a chip's container, or a track row
export const HoverPlay = Html.component({
  name: "HoverPlay",
  props: HoverPlayProps,
  model: HoverPlayModel,
  message: HoverPlayMessage,
  reads: {
    playOnHover: PlayOnHover,
    popovers: {
      owner: Popovers,
      report: (model, props, id) => {
        const content = model.popover === "closed" ? null : popoverContent(props, model);
        return (
          content && {
            anchor: anchorName(id("popover")),
            touch: model.popover === "touch",
            content,
          }
        );
      },
    },
  },
  restore: false,
}).make({
  init: () => ({
    generation: 0,
    status: "idle" as const,
    playing: null,
    popover: "closed" as const,
  }),
  update: ($, message) => {
    const generation = $.model.generation + 1;

    const start = (popover: HoverPlayModel["popover"] = $.model.popover) => {
      const { load } = $.props;

      if (load._tag === "FirstTrackOf") {
        return $.evolve({ generation, status: "loading", playing: null, popover }).run(
          LoadFirstTrack.make({ albumId: load.albumId, generation }),
        );
      }
      if (!load.track.url) return $.evolve({ generation, popover });

      return $.evolve({ generation, status: "playing", playing: load.track, popover }).send(
        NowPlaying,
        NowPlayingMessage.StartedTrack({ track: load.track }),
      );
    };

    const stop = (popover: HoverPlayModel["popover"] = $.model.popover) => {
      const url = $.model.playing?.url;
      const stopped = $.evolve({ generation, status: "idle", playing: null, popover });

      return url ? stopped.send(NowPlaying, NowPlayingMessage.StoppedTrack({ url })) : stopped;
    };

    return HoverPlayMessage.match(message, {
      EnteredWithMouse: () => ($.reads.playOnHover.enabled ? start() : $.model),
      LeftWithMouse: () => stop(),
      HeldDown: () => start("touch"),
      ReleasedHold: () => stop("closed"),
      OpenedPopover: () => $.evolve({ popover: "open" }),
      ClosedPopover: () => $.evolve({ popover: "closed" }),
      LoadedFirstTrack: ({ generation, track }) => {
        if (generation !== $.model.generation) return $.model;
        if (!track?.url) return $.evolve({ status: "idle" });

        return $.evolve({ status: "playing", playing: track }).send(
          NowPlaying,
          NowPlayingMessage.StartedTrack({ track }),
        );
      },
    });
  },
  parts: (p) => ({
    container: p.part("div", (element) =>
      element
        .style({ anchorName: anchorName(p.id("popover")) })
        .on("mouseenter", HoverPlayMessage.OpenedPopover())
        .on("mouseleave", HoverPlayMessage.ClosedPopover())
        .on("focusin", HoverPlayMessage.OpenedPopover())
        .on("focusout", HoverPlayMessage.ClosedPopover())
        .onMount(HoverPlayGestures({})),
    ),
  }),
});

// ---------------------------------------------------------------------------
// the play button next to a page's title, which names its track in a popover
// ---------------------------------------------------------------------------

export const PlayButtonMessage = UiSchema.TaggedEnum({
  ClickedPlay: {},
  OpenedPopover: {},
  ClosedPopover: {},
});

export const NamedPlayButton = Html.component({
  name: "NamedPlayButton",
  props: Schema.Struct({
    track: PlaybackTrack,
    note: Schema.optional(Schema.String),
    color: Schema.optional(Schema.String),
  }),
  model: Schema.Struct({ popover: Schema.Boolean }),
  message: PlayButtonMessage,
  reads: {
    nowPlaying: NowPlaying,
    popovers: {
      owner: Popovers,
      report: (model, props, id) =>
        model.popover
          ? {
              anchor: anchorName(id("popover")),
              touch: false,
              content: { _tag: "TrackCard" as const, track: props.track, note: props.note },
            }
          : null,
    },
  },
  restore: false,
}).make({
  init: () => ({ popover: false }),
  update: ($, message) =>
    PlayButtonMessage.match(message, {
      ClickedPlay: () => {
        const { track } = $.props;
        const playing = Boolean(track.url) && $.reads.nowPlaying.track?.url === track.url;

        return $.send(
          NowPlaying,
          playing ? NowPlayingMessage.StoppedTrack({}) : NowPlayingMessage.StartedTrack({ track }),
        );
      },
      OpenedPopover: () => $.evolve({ popover: true }),
      ClosedPopover: () => $.evolve({ popover: false }),
    }),
  view: (h) => {
    const { track, color } = h.props;
    const playing = Boolean(track.url) && h.reads.nowPlaying.track?.url === track.url;

    return h.button
      .attrs({
        type: "button",
        "aria-label": playing ? "Stop playback" : "Play track",
        "aria-pressed": String(playing),
      })
      .on("mouseenter", PlayButtonMessage.OpenedPopover())
      .on("mouseleave", PlayButtonMessage.ClosedPopover())
      .on("focus", PlayButtonMessage.OpenedPopover())
      .on("blur", PlayButtonMessage.ClosedPopover())
      .class("btn", "size-9 shrink-0 justify-center")
      .style({ backgroundColor: color, anchorName: anchorName(h.id("popover")) })
      .disabled(!track.url)
      .on("click", PlayButtonMessage.ClickedPlay())
      .children(playing ? "■" : "▶");
  },
});
