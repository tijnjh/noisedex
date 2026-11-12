import { useGenreFilters } from "#hooks/use-genre-filters";
import { scrollRegions } from "#lib/scroll-regions";
import { vtName } from "#lib/utils";
import { Link, useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "cn";
import { AnimatePresence, motion, type MotionNodeAnimationOptions } from "motion/react";
import {
  useState,
  useEffect,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  UIEvent,
} from "react";
import type { MergeExclusive } from "type-fest";

export function Layout({
  header,
  children,
  leading,
  trailing,
  accentColor,
}: { header: ComponentProps<typeof Header> } & MergeExclusive<
  { children?: ReactNode },
  { leading: ReactNode; trailing: ReactNode }
> & { accentColor?: string | Promise<string | undefined> }) {
  const [resolvedColor, setResolvedColor] = useState<{
    source: typeof accentColor;
    color: string | undefined;
  }>();

  useEffect(() => {
    let active = true;
    if (accentColor instanceof Promise) {
      void accentColor.then(
        (color) => {
          if (active) setResolvedColor({ source: accentColor, color });
        },
        () => {},
      );
    }
    return () => {
      active = false;
    };
  }, [accentColor]);

  const color =
    typeof accentColor === "string"
      ? accentColor
      : resolvedColor?.source === accentColor
        ? resolvedColor?.color
        : undefined;

  const [atTop, setAtTop] = useState(true);

  function handleContainerScroll(e: UIEvent) {
    // lil bit of margin before setting it so it doesnt show both the title in the header and the page
    setAtTop(e.currentTarget.scrollTop < 48);
  }

  return (
    <div
      className="relative isolate grid grid-rows-[min-content_auto] overflow-hidden"
      style={{ "--page-accent": color } as CSSProperties}
    >
      {color && <div data-page-backdrop aria-hidden="true" />}

      <Header
        collapsed={header.collapsed ?? !atTop}
        title={atTop ? "" : header.title}
        titleClassName={header.titleClassName}
        titleVt={header.titleVt}
      />

      <div
        data-scroll-restoration-id={scrollRegions.page}
        onScroll={handleContainerScroll}
        className={cn("grid overflow-y-auto", !children && "p-3")}
      >
        {children ? (
          <main className="flex min-h-0 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </main>
        ) : (
          <>
            <main className="grid h-full grid-cols-1 gap-6 max-lg:content-start lg:grid-cols-[auto_1fr] lg:overflow-hidden">
              <div
                data-scroll-restoration-id={scrollRegions.sidebar}
                onScroll={handleContainerScroll}
                className="flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto xl:w-172"
              >
                <motion.h1
                  animate={{
                    opacity: atTop ? 1 : 0,
                  }}
                  className={cn("mb-8 text-4xl text-balance md:text-5xl", header.titleClassName)}
                >
                  {header.title}
                </motion.h1>

                {leading}
              </div>
              {trailing}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

function Title({
  title,
  titleClassName,
  titleVt,
  collapsed = false,
}: {
  title?: string;
  titleClassName?: string;
  titleVt?: string;
  collapsed?: boolean;
}) {
  const segAnimConfig: MotionNodeAnimationOptions = {
    initial: { width: 0 },
    animate: { width: "auto" },
    exit: { width: 0 },
  };

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="flex items-center gap-3 truncate">
      <Link to="/" className="font-logo text-2xl hover:opacity-75">
        <div
          className="group flex *:overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <span {...vtName`header-title-n`}>n</span>
          <AnimatePresence initial={false}>
            {(!collapsed || isHovering) && (
              <motion.span key="123" {...segAnimConfig} {...vtName`header-title-oise`}>
                oise
              </motion.span>
            )}
          </AnimatePresence>

          <span {...vtName`header-title-d`}>d</span>

          <AnimatePresence initial={false}>
            {(!collapsed || isHovering) && (
              <motion.span key="1234" {...segAnimConfig} {...vtName`header-title-ex`}>
                ex
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <span className="sr-only">noisedex</span>
      </Link>

      <AnimatePresence>
        {title && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            &bull;
            <h1 {...vtName`${titleVt}`} className={cn("truncate text-2xl", titleClassName)}>
              {title}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header(title: ComponentProps<typeof Title>) {
  return (
    <header
      className={cn(
        "flex gap-3 overflow-hidden p-3 max-md:flex-col md:items-center md:justify-between",
      )}
    >
      <Title {...title} />

      <SearchBar />
    </header>
  );
}

function SearchBar() {
  const isHomepage = useLocation({
    select: (location) => location.pathname === "/",
  });
  const filters = useGenreFilters();
  const q = useSearch({
    strict: false,
    select: (search) => search.q ?? "",
  });
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(q);
  const value = isHomepage ? filters.query : searchTerm;

  return (
    <form
      {...vtName`search`}
      className="flex grow gap-3 md:max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        const query = value.trim();
        if (!query) return;
        void navigate({
          to: "/search",
          search: {
            q: query,
          },
        });
      }}
    >
      <input
        value={value}
        onChange={(e) =>
          isHomepage
            ? filters.setQuery(e.currentTarget.value)
            : setSearchTerm(e.currentTarget.value)
        }
        required
        aria-label={
          isHomepage
            ? "Filter genres; press Enter to search artists, albums, and tracks"
            : "Search artists, albums, and tracks"
        }
        className="h-9 min-w-0 grow px-3 surface"
        name="q"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder={
          isHomepage ? "filter genres, enter to search" : "look up an artist, album, or track"
        }
      />

      <button type="submit" aria-label="Search" className="btn-inverse size-9 justify-center">
        →
      </button>
    </form>
  );
}
