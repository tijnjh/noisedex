import { Component, Mount, type View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Effect } from "effect";
import type { AsyncResult } from "effect/reactivity";
import { Ghost, fadeIn, fadeOut } from "skullet/internal";

// a thin wrapper over skullet's vanilla pieces, laid out as its react `Skeleton` is: the content
// is drawn unseen in the ghost while loading, and skullet measures a skeleton over it

const seen = "data-skullet-seen";

// brings a pane in as skullet plans it; the reveal's first pane has nothing to replace
const SkulletPane = Mount.make("SkulletPane", {}, (pane: HTMLElement) =>
  Effect.promise(() => {
    const reveal = pane.parentElement;
    const initial = !reveal?.hasAttribute(seen);
    reveal?.setAttribute(seen, "");
    return fadeIn(pane, undefined, { initial });
  }).pipe(Effect.as(Component.noop)),
);

// the pane a new one replaces leaves as skullet's react version lets it: put back in place for
// `fadeOut`, which fades it and eases the reveal's height to the new pane's
const exiting = new WeakSet<Element>();

const SkulletReveal = Mount.make("SkulletReveal", {}, (reveal: HTMLElement) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      // the removed pane is already out of the layout, so its box is the reveal's last one
      let box = { width: reveal.offsetWidth, height: reveal.offsetHeight };
      const resize = new ResizeObserver(() => {
        box = { width: reveal.offsetWidth, height: reveal.offsetHeight };
      });
      resize.observe(reveal);

      const mutations = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            if (!(node instanceof HTMLElement) || !node.hasAttribute("skullet-pane")) continue;
            if (exiting.has(node)) continue;
            exiting.add(node);
            reveal.insertBefore(node, reveal.firstChild);
            void fadeOut(node, { top: 0, left: 0, ...box }).then(() => node.remove());
          }
        }
      });
      mutations.observe(reveal, { childList: true });

      return () => {
        resize.disconnect();
        mutations.disconnect();
      };
    }),
    (cleanup) => Effect.sync(cleanup),
  ).pipe(Effect.andThen(Effect.never), Effect.as(Component.noop)),
);

const SkulletGhost = Mount.make("SkulletGhost", {}, (loading: HTMLElement) =>
  Effect.acquireRelease(
    Effect.sync(() => new Ghost(loading, { exact: false, refetch: false })),
    (ghost) => Effect.sync(() => ghost.destroy()),
  ).pipe(Effect.andThen(Effect.never), Effect.as(Component.noop)),
);

export const Skeleton = <M, C extends View.Children<M>>(
  h: Html.H<M>,
  options: { loading: boolean; label?: string | undefined; children: C },
) => {
  const { loading, label, children } = options;

  return h.div
    .attr("skullet-reveal", "")
    .attr("aria-busy", loading ? "true" : undefined)
    .onMount(SkulletReveal({}))
    .children(
      h.div
        .key(loading ? "skeleton" : "content")
        .attr("skullet-pane", "")
        .onMount(SkulletPane({}))
        .children(
          loading
            ? [
                label && h.span.attr("skullet-status", "").children(label),
                h.div
                  .attrs({ "skullet-loading": "", "aria-hidden": "true", inert: "" })
                  .onMount(SkulletGhost({}))
                  .children(
                    h.div.attr("skullet-ghost", "").children(children),
                    h.div.attr("skullet-snapshot", ""),
                    h.div.attr("skullet-layer", ""),
                  ),
              ]
            : children,
        ),
    );
};

// (as a list to spread into children) a query's data, or a skeleton drawn from `sample` while it loads. a failure shows nothing
export const AsyncContent = <M, A, E, C extends View.Children<M>>(
  h: Html.H<M>,
  options: {
    result: AsyncResult.AsyncResult<A, E>;
    sample: A;
    label: string;
    children: (data: A) => C;
  },
) => {
  const { result, sample, label, children } = options;

  if (result._tag === "Failure") return [];

  return [
    Skeleton(h, {
      loading: result._tag === "Initial",
      label,
      children: children(result._tag === "Success" ? result.value : sample),
    }),
  ];
};
