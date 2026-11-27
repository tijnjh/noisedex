import { Header } from "#components/header";
import { NamedPlayButton } from "#components/play";
import { Accent, PageAccent } from "#components/providers";
import { Skeleton } from "#components/skeleton";
import { TitlePlayback } from "#domain/playback";
import { scrollRegions, type ScrollRegion } from "#lib/scroll-regions";
import logoSvg from "../assets/favicon.svg?raw";
import logoUrl from "../assets/favicon.svg?url";
import { Component, Mount, UiSchema, type View } from "@effect/ui";
import { Html, HtmlHead } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { AppRoute } from "../routes.ts";

// ---------------------------------------------------------------------------
// scroll restoration for the page's scrolling regions, per history entry
// ---------------------------------------------------------------------------

const historyIndex = () => {
  const state = history.state as { "@effect/ui"?: { index?: number } } | null;
  return state?.["@effect/ui"]?.index ?? 0;
};

export const RestoreScroll = Mount.make(
  "RestoreScroll",
  { args: { region: Schema.String } },
  (element: HTMLElement, { region }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const key = `scroll:${historyIndex()}:${location.pathname}:${region}`;

        let saved: number | undefined;
        try {
          const value = sessionStorage.getItem(key);
          saved = value === null ? undefined : Number(value);
        } catch {}

        // the content may still be laying out, so try again on the next frames
        let tries = 0;
        const restore = () => {
          if (saved === undefined || element.scrollTop === saved) return;
          element.scrollTop = saved;
          if (++tries < 10) frame = requestAnimationFrame(restore);
        };
        let frame = requestAnimationFrame(restore);
        restore();

        let pending = false;
        const save = () => {
          if (pending) return;
          pending = true;
          requestAnimationFrame(() => {
            pending = false;
            saved = undefined;
            try {
              sessionStorage.setItem(key, String(element.scrollTop));
            } catch {}
          });
        };
        element.addEventListener("scroll", save, { passive: true });

        return () => {
          cancelAnimationFrame(frame);
          element.removeEventListener("scroll", save);
        };
      }),
      (cleanup) => Effect.sync(cleanup),
    ).pipe(Effect.andThen(Effect.never), Effect.as(Component.noop)),
);

export const scrollRegion = (region: ScrollRegion) =>
  RestoreScroll({ region: scrollRegions[region] });

// ---------------------------------------------------------------------------
// the page layout
// ---------------------------------------------------------------------------

function coloredLogo(color?: string) {
  if (!color) return logoUrl;
  const svg = logoSvg
    .replace(/<style>.*?<\/style>/s, "")
    .replace('fill="#18181b"', `fill="${color}"`);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const LayoutProps = Schema.Struct({
  route: AppRoute,
  title: Schema.optional(Schema.String),
  titleClassName: Schema.optional(Schema.String),
  // view transition name of the title in the header
  titleVt: Schema.optional(Schema.String),
  accent: Schema.optional(PageAccent),
  // a sidebar (artwork, title, `leading`) next to a `trailing` content pane, or one full-size pane
  split: Schema.optional(Schema.Boolean),
  artwork: Schema.optional(
    Schema.Struct({ src: Schema.String, alt: Schema.String, vt: Schema.optional(Schema.String) }),
  ),
  playback: Schema.optional(
    Schema.TaggedUnion({ Pending: {}, Ready: { playback: TitlePlayback } }),
  ),
});
export type LayoutProps = typeof LayoutProps.Type;

export const LayoutMessage = UiSchema.TaggedEnum({
  ScrolledTitle: { atTop: Schema.Boolean },
});

export const Layout = Html.component({
  name: "Layout",
  props: LayoutProps,
  // once the big title scrolls out of view, it moves into the header
  model: Schema.Struct({ atTop: Schema.Boolean }),
  message: LayoutMessage,
  slots: ["content", "leading", "trailing"],
  reads: {
    accent: { owner: Accent, report: (_, props) => props.accent ?? {} },
  },
  restore: false,
}).make({
  init: () => ({ atTop: true }),
  update: (_, { atTop }) => ({ atTop }),
  // the favicon, tinted with the page's accent color; album and track pages use their artwork
  head: ({ props: { accent } }) => [
    accent?.artwork
      ? HtmlHead.link({ rel: "icon", href: accent.artwork, key: "icon" })
      : HtmlHead.link({
          rel: "icon",
          href: coloredLogo(accent?.color),
          type: "image/svg+xml",
          key: "icon",
        }),
  ],
  view: (h, { atTop }) => {
    const { route, title, titleClassName, titleVt, accent, split, artwork, playback } = h.props;
    const color = accent?.color;
    const titleHeight = artwork ? 360 : 60;

    const onScroll = ({ top }: { top: number }) =>
      top < titleHeight !== atTop ? LayoutMessage.ScrolledTitle({ atTop: !atTop }) : undefined;

    const header = Header(h, {
      key: "header",
      props: { route, title, titleClassName, titleVt, collapsed: !atTop },
    });

    const shown = playback !== undefined;
    const ready = playback?._tag === "Ready" ? playback.playback : undefined;

    const main = split
      ? // one scrolling stack on small screens, two scrolling columns on large ones
        h.main
          .onMount(scrollRegion("page"))
          .on("scroll", onScroll)
          .class(
            "grid h-full grid-cols-1 gap-6 overflow-y-auto px-3 max-lg:content-start max-md:pt-15 lg:grid-cols-[auto_1fr] lg:overflow-hidden",
          )
          .children(
            h.div
              .onMount(scrollRegion("sidebar"))
              .on("scroll", onScroll)
              .class("flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto xl:w-172")
              .children(
                artwork &&
                  h.img
                    .style({ viewTransitionName: artwork.vt })
                    .attrs({ src: artwork.src, alt: artwork.alt, width: "600", height: "600" })
                    .class("mx-auto mt-6 aspect-square w-full max-w-72"),

                h.div
                  .attr("data-title-row", "")
                  .style({ opacity: atTop ? "1" : "0" })
                  .class("my-6 flex items-start")
                  .children(
                    h.div
                      .attr("data-title-playback", "")
                      .attr("data-shown", shown ? "" : undefined)
                      .class("shrink-0 overflow-hidden")
                      .children(
                        Skeleton(h, {
                          loading: !ready,
                          label: "Loading playback",
                          children: [
                            NamedPlayButton(h, {
                              key: "play",
                              props: { track: ready?.track ?? {}, note: ready?.note, color },
                            }),
                          ],
                        }),
                      ),
                    h.h1
                      .class(
                        "text-4xl text-balance [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] max-md:mt-1 md:text-5xl",
                        titleClassName,
                      )
                      .children(title ?? ""),
                  ),

                h.slots.leading,
              ),

            h.slots.trailing,
          )
      : h.main
          .onMount(scrollRegion("page"))
          .class("flex min-h-0 flex-col overflow-hidden")
          .children(h.div.class("min-h-0 flex-1 overflow-hidden").children(h.slots.content));

    return h.div
      .class(
        "relative isolate grid grid-rows-[minmax(0,1fr)_min-content] overflow-hidden md:grid-rows-[min-content_minmax(0,1fr)]",
      )
      .style({ "--page-accent": color })
      .children(h.div.attrs({ "data-page-backdrop": "", "aria-hidden": "true" }), header, main);
  },
});

// the `trailing` pane of a split layout
export const ContentPane = <M, C extends View.Children<M>>(
  h: Html.H<M>,
  options: { label: string; className?: string; children: C },
) =>
  h.section
    .attr("aria-label", options.label)
    .onMount(scrollRegion("content"))
    .class("flex min-w-0 flex-col gap-3 lg:overflow-y-auto", options.className)
    .children(options.children);
