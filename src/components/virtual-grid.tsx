import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import type { Key, ReactNode, Ref } from "react";

const gap = { x: 12, y: 12 };
const itemHeight = 36;

export function VirtualGrid<T>({
  entries,
  children,
  gridRef,
  getKey,
  itemWidthInRem = 12,
}: {
  entries: T[];
  children: (entry: T) => ReactNode;
  gridRef?: Ref<HTMLUListElement>;
  getKey?: (entry: T) => Key;
  itemWidthInRem?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousEntryCount = useRef(entries.length);
  const [viewport, setViewport] = useState({
    width: 300,
    rem: 16,
    paddingTop: 12,
  });
  const minWidth = itemWidthInRem * viewport.rem;
  const columns = Math.max(
    1,
    Math.floor((viewport.width + gap.x) / (minWidth + gap.x)),
  );
  const itemWidth = Math.max(
    0,
    (viewport.width - gap.x * (columns - 1)) / columns,
  );
  const rowCount = Math.ceil(entries.length / columns);

  useEffect(() => {
    const parent = parentRef.current;
    const content = contentRef.current;
    if (!parent || !content) return;

    const measure = () => {
      const style = getComputedStyle(content);
      const next = {
        width: Math.max(
          0,
          content.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
        ),
        rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
        paddingTop: parseFloat(style.paddingTop),
      };
      setViewport((previous) =>
        previous.width === next.width &&
        previous.rem === next.rem &&
        previous.paddingTop === next.paddingTop
          ? previous
          : next,
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    observer.observe(content);
    measure();

    return () => observer.disconnect();
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    gap: gap.y,
    overscan: 8,
    scrollMargin: viewport.paddingTop,
    // Render the same initial rows on the server and during hydration.
    initialRect: { width: 300, height: 600 },
  });

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
      data-scroll-restoration-id="genre-grid"
      className="h-full overflow-x-hidden overflow-y-auto"
    >
      <div ref={contentRef} className="p-3">
        <ul
          ref={gridRef}
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
                  key={getKey ? getKey(entry) : index}
                  className="absolute"
                  style={{
                    height: itemHeight,
                    width: itemWidth,
                    transform: `translate(${column * (itemWidth + gap.x)}px, ${row.start - viewport.paddingTop}px)`,
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
