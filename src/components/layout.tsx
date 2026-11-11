import { useGenreFilters } from "#hooks/use-genre-filters";
import { siteName } from "#lib/constants";
import { scrollRegions } from "#lib/scroll-regions";
import { vtName } from "#lib/utils";
import {
  Link,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { cn } from "cn";
import {
  useState,
  useEffect,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
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
  return (
    <div
      className="relative isolate grid grid-rows-[min-content_auto] overflow-hidden"
      style={{ "--page-accent": color } as CSSProperties}
    >
      {color && <div data-page-backdrop aria-hidden="true" />}
      <Header {...header} />

      <div
        data-scroll-restoration-id={scrollRegions.page}
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
                className="flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto"
              >
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

function Title({ title, titleVt }: { title: string; titleVt?: string }) {
  return (
    <div className="flex items-center gap-3 font-bold">
      <Link to="/" className="text-2xl hover:underline">
        {siteName}
      </Link>
      &rarr;
      <h1 {...vtName`${titleVt}`} className="truncate text-2xl font-bold">
        {title}
      </h1>
    </div>
  );
}

function Header({ title, titleVt }: { title: string; titleVt?: string }) {
  return (
    <header
      className={cn(
        "flex gap-3 overflow-hidden p-3 max-md:flex-col md:items-center md:justify-between",
      )}
    >
      <Title title={title} titleVt={titleVt} />

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
        navigate({
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
          isHomepage
            ? "filter genres, enter to search"
            : "look up an artist, album, or track"
        }
      />

      <button
        type="submit"
        aria-label="Search"
        className="btn-inverse size-9 justify-center"
      >
        →
      </button>
    </form>
  );
}
