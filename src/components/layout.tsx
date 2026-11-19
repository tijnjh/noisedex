import { Header } from "#components/header";
import { useResolved } from "#hooks/use-resolved";
import type { PlaybackTrack } from "#lib/playback";
import { scrollRegions } from "#lib/scroll-regions";
import { cn } from "cn";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useState, type CSSProperties, type ReactNode, type UIEvent } from "react";
import { Skeleton } from "skullet/react";
import { NamedPlayButton } from "./play-button";

interface TitlePlayback {
  track: PlaybackTrack;
  note?: string;
}

export function Layout({
  title,
  titleClassName,
  titleVt,
  accentColor,
  children,
  artwork,
  playback,
  leading,
  trailing,
}: {
  title?: string;
  titleClassName?: string;
  // view transition name of the title in the header
  titleVt?: string;
  accentColor?: string | Promise<string | undefined>;
  // one full-size pane
  children?: ReactNode;
  // or without children, a sidebar (artwork, title, `leading`) next to a `trailing` content pane
  artwork?: { src: string; alt: string; vt?: string };
  playback?: TitlePlayback | Promise<TitlePlayback | undefined>;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const color = useResolved(accentColor).value;
  const resolvedPlayback = useResolved(playback);

  // once the big title scrolls out of view, it moves into the header
  const [atTop, setAtTop] = useState(true);
  const titleHeight = artwork ? 360 : 60;

  function handleScroll(e: UIEvent) {
    setAtTop(e.currentTarget.scrollTop < titleHeight);
  }

  return (
    <div
      className="relative isolate grid grid-rows-[minmax(0,1fr)_min-content] overflow-hidden md:grid-rows-[min-content_minmax(0,1fr)]"
      style={{ "--page-accent": color } as CSSProperties}
    >
      <div data-page-backdrop aria-hidden="true" />

      <Header
        title={atTop ? undefined : title}
        titleClassName={titleClassName}
        titleVt={titleVt}
        collapsed={!atTop}
      />

      {children ? (
        <main
          data-scroll-restoration-id={scrollRegions.page}
          className="flex min-h-0 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </main>
      ) : (
        // one scrolling stack on small screens, two scrolling columns on large ones
        <main
          data-scroll-restoration-id={scrollRegions.page}
          onScroll={handleScroll}
          className="grid h-full grid-cols-1 gap-6 overflow-y-auto px-3 max-lg:content-start max-md:pt-15 lg:grid-cols-[auto_1fr] lg:overflow-hidden"
        >
          <div
            data-scroll-restoration-id={scrollRegions.sidebar}
            onScroll={handleScroll}
            className="flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto xl:w-172"
          >
            {artwork && (
              <img
                style={{ viewTransitionName: artwork.vt }}
                src={artwork.src}
                alt={artwork.alt}
                className="mx-auto mt-6 aspect-square w-full max-w-72"
                width={600}
                height={600}
              />
            )}

            <m.div animate={{ opacity: atTop ? 1 : 0 }} className="my-6 flex items-start">
              <AnimatePresence initial={false}>
                {(resolvedPlayback.pending || resolvedPlayback.value) && (
                  <m.div
                    className="shrink-0 overflow-hidden"
                    initial={{ width: 0, marginRight: 0 }}
                    animate={{ width: "auto", marginRight: 12 }}
                    exit={{ width: 0, marginRight: 0, opacity: 0 }}
                  >
                    <Skeleton loading={resolvedPlayback.pending} label="Loading playback">
                      <NamedPlayButton
                        track={resolvedPlayback.value?.track ?? {}}
                        note={resolvedPlayback.value?.note}
                        color={color}
                      />
                    </Skeleton>
                  </m.div>
                )}
              </AnimatePresence>
              <h1
                className={cn(
                  "text-4xl text-balance [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] max-md:mt-1 md:text-5xl",
                  titleClassName,
                )}
              >
                {title}
              </h1>
            </m.div>

            {leading}
          </div>

          {trailing}
        </main>
      )}
    </div>
  );
}

// the `trailing` pane of a two-column layout
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
