import { GenreList } from "#components/chips";
import { AsyncContent } from "#components/skeleton";
import type { WikipediaSummary } from "#lib/api/platforms/wikipedia";
import { Mount, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Collapsible } from "@effect/ui-kit";
import { Effect, Queue, Schema, Stream } from "effect";
import type { AsyncResult } from "effect/reactivity";

const sampleArticle: WikipediaSummary = {
  title: "Wikipedia description",
  extract:
    "Music brings together a wide range of sounds, influences, and traditions. Artists develop their own distinctive styles through recordings and performances. Their work connects musical ideas across generations and reaches listeners around the world. Each release explores new themes and builds on the music that came before it. These influences shape the sound and its place in music history.",
  url: "https://en.wikipedia.org/",
};

export const ArticleMessage = UiSchema.TaggedEnum({
  ToggledArticle: { open: Schema.Boolean },
  MeasuredPreview: { overflows: Schema.Boolean },
});

// whether the clamped preview cuts the text off, so there's more to show
const PreviewOverflow = Mount.makeStream("PreviewOverflow", {}, (preview: HTMLElement) =>
  Stream.callback<typeof ArticleMessage.Type>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const observer = new ResizeObserver(() =>
          Queue.offerUnsafe(
            queue,
            ArticleMessage.MeasuredPreview({
              overflows: preview.scrollHeight > preview.clientHeight + 1,
            }),
          ),
        );
        observer.observe(preview);
        return observer;
      }),
      (observer) => Effect.sync(() => observer.disconnect()),
    ).pipe(Effect.andThen(Effect.never)),
  ),
);

const Article = Html.component({
  name: "Article",
  props: Schema.Struct({ title: Schema.String, extract: Schema.String, url: Schema.String }),
  model: Schema.Struct({ open: Schema.Boolean, overflows: Schema.Boolean }),
  message: ArticleMessage,
  restore: false,
}).make({
  init: () => ({ open: false, overflows: true }),
  update: ($, message) =>
    ArticleMessage.match(message, {
      ToggledArticle: ({ open }) => $.evolve({ open }),
      MeasuredPreview: ({ overflows }) =>
        overflows === $.model.overflows ? $.model : $.evolve({ overflows }),
    }),
  view: (h, { open, overflows }) => {
    const { extract, url } = h.props;

    return Collapsible(h, {
      props: { open },
      onEmit: {
        Toggled: ({ open }) => ArticleMessage.ToggledArticle({ open }),
        Settled: () => undefined,
      },
      view: (collapsible) =>
        collapsible.root(h.div.attr("data-wikipedia-description", "")).children(
          h.p
            .attrs({ "aria-hidden": open ? "true" : undefined, "data-wikipedia-preview": "" })
            .class("line-clamp-4 whitespace-pre-line")
            .onMount(PreviewOverflow({}))
            .children(extract),

          collapsible
            .panel(h.div.attr("data-wikipedia-panel", ""))
            ?.children(h.p.class("whitespace-pre-line").children(extract)),

          h.div
            .class("mt-2 flex flex-wrap items-center gap-x-4 gap-y-2")
            .children(
              (overflows || open) &&
                collapsible
                  .trigger(h.button.class("btn"))
                  .children(open ? "show less" : "show more"),
              h.a
                .attrs({ href: url, target: "_blank", rel: "noreferrer" })
                .class("w-fit underline opacity-80 hover:opacity-100")
                .children("read more on wikipedia"),
            ),
        ),
    });
  },
});

export const WikipediaDescription = <M>(
  h: Html.H<M>,
  options: {
    summary: AsyncResult.AsyncResult<WikipediaSummary | null, never>;
    // only once there's an article to read them from
    genres?: AsyncResult.AsyncResult<ReadonlyArray<string>, never> | undefined;
  },
) => [
  ...AsyncContent(h, {
    result: options.summary,
    sample: sampleArticle as WikipediaSummary | null,
    label: "Loading Wikipedia description",
    children: (article) => (article ? [Article(h, { key: article.url, props: article })] : []),
  }),

  // no article, no genres from it
  ...(options.genres && !(options.summary._tag === "Success" && options.summary.value === null)
    ? AsyncContent(h, {
        result: options.genres,
        sample: ["alternative rock", "indie rock"] as ReadonlyArray<string>,
        label: "Loading Wikipedia genres",
        children: (names) => GenreList(h, { title: "genres from wikipedia", names: [...names] }),
      })
    : []),
];
