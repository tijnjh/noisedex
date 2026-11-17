import { useGenreFilters } from "#hooks/use-genre-filters";
import { usePopover } from "#hooks/use-popover";
import { viewTransition } from "#lib/utils";
import { Link, useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "cn";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { CSSProperties, useState, type ReactNode } from "react";
import { Switch } from "./switch";
import { useAtom } from "jotai";
import { playOnHoverAtom } from "#lib/atoms";

export interface HeaderProps {
  title?: string;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  titleVt?: string;
  collapsed?: boolean;
}

export function Header({ collapsed, ...titleProps }: HeaderProps) {
  const [playOnHover, setPlayOnHover] = useAtom(playOnHoverAtom);

  return (
    <header className="flex gap-3 overflow-hidden p-3 max-md:order-last max-md:flex-col md:items-center md:justify-between">
      <div className="flex items-center gap-3 truncate">
        <Logo collapsed={collapsed} />
        <PageTitle {...titleProps} />
      </div>

      <div className="flex grow items-center gap-3 md:max-w-xl">
        <label className="flex cursor-pointer items-center gap-3 select-none max-md:hidden pointer-coarse:hidden">
          play on hover
          <Switch checked={playOnHover} onCheckedChange={setPlayOnHover} />
        </label>

        <SearchBar />
      </div>
    </header>
  );
}

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  const [isHovering, setIsHovering] = useState(false);
  const expanded = !collapsed || isHovering;

  return (
    <Link to="/" className="font-logo text-2xl hover:opacity-75">
      <div
        className="group flex *:overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <span {...viewTransition("header-title-n")}>n</span>
        <CollapsibleLetters show={expanded} vt="header-title-oise">
          oise
        </CollapsibleLetters>
        <span {...viewTransition("header-title-d")}>d</span>
        <CollapsibleLetters show={expanded} vt="header-title-ex">
          ex
        </CollapsibleLetters>
      </div>

      <span className="sr-only">noisedex</span>
    </Link>
  );
}

function CollapsibleLetters({
  show,
  vt,
  children,
}: {
  show: boolean;
  vt: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <m.span
          key={vt}
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          exit={{ width: 0 }}
          {...viewTransition(vt)}
        >
          {children}
        </m.span>
      )}
    </AnimatePresence>
  );
}

function PageTitle({ title, titleClassName, titleVt, titleStyle }: HeaderProps) {
  console.log({ titleStyle });
  return (
    <AnimatePresence>
      {title && (
        <m.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          &bull;
          <h1
            {...viewTransition(titleVt)}
            style={titleStyle}
            className={cn(
              "truncate text-2xl transition-[font-weight] duration-500",
              titleClassName,
            )}
          >
            {title}
          </h1>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// on the homepage the search bar doubles as the genre filter
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
  const setValue = isHomepage ? filters.setQuery : setSearchTerm;

  return (
    <form
      {...viewTransition("search")}
      className="flex grow gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const query = value.trim();
        if (!query) return;
        void navigate({ to: "/search", search: { q: query } });
      }}
    >
      {isHomepage && <SortButton filters={filters} />}

      <input
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        required
        aria-label={
          isHomepage
            ? "Filter genres; press Enter to search artists, albums, and tracks"
            : "Search artists, albums, and tracks"
        }
        className="h-9 min-w-0 grow surface px-3"
        name="q"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        placeholder={
          isHomepage ? "filter genres, enter to search" : "look up an artist, album, or track"
        }
      />

      <button type="submit" aria-label="Search" className="btn size-9 justify-center">
        ⌕
      </button>
    </form>
  );
}

// cycles the homepage genre order; the popover names the current and next order
function SortButton({ filters }: { filters: ReturnType<typeof useGenreFilters> }) {
  const popoverProps = usePopover(
    <p>
      sorted by {filters.sort.value}. click to sort by {filters.nextSort.value}.
    </p>,
  );

  return (
    <button
      {...popoverProps}
      type="button"
      onClick={filters.cycleSort}
      aria-label={`Sorted by ${filters.sort.value}; sort by ${filters.nextSort.value}`}
      className="btn size-9 shrink-0 justify-center px-0 text-sm"
    >
      {filters.sort.label}
    </button>
  );
}
