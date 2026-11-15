import { Header, type HeaderProps } from "#components/header";
import { useResolved } from "#hooks/use-resolved";
import { scrollRegions } from "#lib/scroll-regions";
import { viewTransition } from "#lib/utils";
import { cn } from "cn";
import { motion } from "motion/react";
import { useState, type CSSProperties, type ReactNode, type UIEvent } from "react";
import type { MergeExclusive } from "type-fest";

interface Artwork {
  src: string;
  alt: string;
  /** view transition name */
  vt?: string;
}

type LayoutProps = {
  header: HeaderProps;
  /** tints the page; may still be loading */
  accentColor?: string | Promise<string | undefined>;
} & MergeExclusive<
  // one full-size pane
  { children?: ReactNode },
  // a sidebar (artwork, title, `leading`) next to a `trailing` content pane
  { leading: ReactNode; trailing: ReactNode; artwork?: Artwork }
>;

export function Layout({ header, children, artwork, leading, trailing, accentColor }: LayoutProps) {
  const color = useResolved(accentColor);

  // once the big title scrolls out of view, it moves into the header
  const [atTop, setAtTop] = useState(true);
  const titleHeight = artwork ? 360 : 60;

  function handleScroll(e: UIEvent) {
    setAtTop(e.currentTarget.scrollTop < titleHeight);
  }

  return (
    <div
      className="relative isolate grid grid-rows-[min-content_auto] overflow-hidden"
      style={{ "--page-accent": color } as CSSProperties}
    >
      <div data-page-backdrop aria-hidden="true" />

      <Header
        {...header}
        collapsed={header.collapsed ?? !atTop}
        title={atTop ? "" : header.title}
      />

      {children ? (
        <main
          data-scroll-restoration-id={scrollRegions.page}
          className="flex min-h-0 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </main>
      ) : (
        // stacked and scrolling as one on small screens, two scrolling columns on large ones
        <main
          data-scroll-restoration-id={scrollRegions.page}
          onScroll={handleScroll}
          className="grid h-full grid-cols-1 gap-6 overflow-y-auto px-3 max-lg:content-start lg:grid-cols-[auto_1fr] lg:overflow-hidden"
        >
          <div
            data-scroll-restoration-id={scrollRegions.sidebar}
            onScroll={handleScroll}
            className="flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto xl:w-172"
          >
            {artwork && (
              <img
                {...viewTransition(artwork.vt)}
                src={artwork.src}
                alt={artwork.alt}
                className="mx-auto mt-6 aspect-square w-full max-w-72"
                width={600}
                height={600}
              />
            )}

            <motion.h1
              animate={{ opacity: atTop ? 1 : 0 }}
              className={cn("my-6 text-4xl text-balance md:text-5xl", header.titleClassName)}
            >
              {header.title}
            </motion.h1>

            {leading}
          </div>

          {trailing}
        </main>
      )}
    </div>
  );
}

/** the scrolling `trailing` pane of a two-column layout */
export function ContentPane({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      data-scroll-restoration-id={scrollRegions.content}
      className={cn("flex min-w-0 flex-col gap-3 lg:overflow-y-auto", className)}
    >
      {children}
    </section>
  );
}
