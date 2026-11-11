import { scrollRegions } from "#lib/scroll-regions";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import type { Key, ReactNode } from "react";

export function VirtualGrid<T>({
  entries,
  children,
  getKey,
}: {
  entries: T[];
  children: (entry: T) => ReactNode;
  getKey: (entry: T) => Key;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const previousEntryCount = useRef(entries.length);
  const [viewport, setViewport] = useState({
    width: 300,
    minWidth: 192,
    itemHeight: 36,
    gap: 12,
    paddingTop: 12,
  });
  const { minWidth, itemHeight, gap } = viewport;
  const columns = Math.max(
    1,
    Math.floor((viewport.width + gap) / (minWidth + gap)),
  );
  const itemWidth = Math.max(
    0,
    (viewport.width - gap * (columns - 1)) / columns,
  );
  const rowCount = Math.ceil(entries.length / columns);

  useEffect(() => {
    const parent = parentRef.current;
    const content = contentRef.current;
    const metrics = metricsRef.current;
    if (!parent || !content || !metrics) return;

    const measure = () => {
      const style = getComputedStyle(content);
      const metricStyle = getComputedStyle(metrics);
      const next = {
        width: Math.max(
          0,
          content.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
        ),
        minWidth: parseFloat(metricStyle.width),
        itemHeight: parseFloat(metricStyle.height),
        gap: parseFloat(metricStyle.paddingRight),
        paddingTop: parseFloat(style.paddingTop),
      };
      setViewport((previous) =>
        previous.width === next.width &&
        previous.minWidth === next.minWidth &&
        previous.itemHeight === next.itemHeight &&
        previous.gap === next.gap &&
        previous.paddingTop === next.paddingTop
          ? previous
          : next,
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    observer.observe(content);
    observer.observe(metrics, { box: "border-box" });
    measure();

    return () => observer.disconnect();
  }, []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    gap,
    overscan: 8,
    scrollMargin: viewport.paddingTop,
    // Render the same initial rows on the server and during hydration.
    initialRect: { width: 300, height: 600 },
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [itemHeight, gap, rowVirtualizer]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    if (previousEntryCount.current !== entries.length) {
      previousEntryCount.current = entries.length;
      rowVirtualizer.scrollToOffset(0);
      return;
    }

    // Filtering or adding columns can leave the virtualizer's previous offset
    // beyond the shorter list, even after the browser clamps the DOM scrollTop.
    const maxOffset = Math.max(0, parent.scrollHeight - parent.clientHeight);
    if ((rowVirtualizer.scrollOffset ?? parent.scrollTop) > maxOffset) {
      rowVirtualizer.scrollToOffset(maxOffset);
    }
  }, [entries.length, rowCount, columns, viewport.paddingTop, rowVirtualizer]);

  return (
    <div
      ref={parentRef}
      data-scroll-restoration-id={scrollRegions.genres}
      className="h-full overflow-x-hidden overflow-y-auto"
    >
      <div ref={contentRef} className="relative px-3 pb-32">
        <div ref={metricsRef} aria-hidden="true" className="grid-metrics" />
        <ul
          className="relative"
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: "100%",
            overflowAnchor: "none",
          }}
        >
          {rowVirtualizer.getVirtualItems().flatMap((row) =>
            Array.from({ length: columns }, (_, column) => {
              const index = row.index * columns + column;
              if (index >= entries.length) return null;
              const entry = entries[index];

              return (
                <li
                  key={getKey(entry)}
                  className="absolute"
                  style={{
                    height: itemHeight,
                    width: itemWidth,
                    transform: `translate(${column * (itemWidth + gap)}px, ${row.start - viewport.paddingTop}px)`,
                  }}
                >
                  {children(entry)}
                </li>
              );
            }),
          )}
        </ul>
      </div>
    </div>
  );
}
