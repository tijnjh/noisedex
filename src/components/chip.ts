import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";

export interface ChipOptions<M> {
  href: string;
  label: string;
  subtitle?: string | undefined;
  artwork?: string | undefined;
  trailing?: View.Input<M> | undefined;
  // tints the background and border, e.g. with the genre color
  tint?: string | undefined;
  className?: string | undefined;
  // view transition names
  vt?: { img?: string | undefined; title?: string | undefined } | undefined;
}

// a link with an optional artwork in front. `container` is the element around both, which a
// hover-to-play part decorates
export const Chip = <M>(
  h: Html.H<M>,
  options: ChipOptions<M>,
  container: Html.Element<M, never, Html.EventsOf<"div">, HTMLDivElement, "div"> = h.div,
) => {
  const { href, label, subtitle, artwork, trailing, tint, className, vt } = options;

  return container.class("flex items-center truncate", subtitle ? "h-12" : "h-control").children(
    artwork &&
      h.img
        .style({ viewTransitionName: vt?.img })
        .class("aspect-square", subtitle ? "size-12" : "size-control")
        .attrs({ src: artwork, loading: "lazy", decoding: "async", alt: "" }),

    h.a
      .attrs({ href, draggable: "false" })
      .class("btn min-w-0 grow px-0", subtitle && "h-full", tint && "chip-tinted", className)
      .style({ "--chip-color": tint })
      .children(
        subtitle
          ? h.span
              .class("flex min-w-0 flex-col px-3 leading-tight")
              .children(
                h.span.style({ viewTransitionName: vt?.title }).class("truncate").children(label),
                h.span.class("truncate text-sm opacity-60").children(subtitle),
              )
          : h.span.style({ viewTransitionName: vt?.title }).class("truncate px-3").children(label),
      ),

    trailing,
  );
};
