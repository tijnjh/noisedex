import { useGenreFilters } from "#hooks/use-genre-filters";
import { usePopover } from "#hooks/use-popover";
import { playOnHoverAtom } from "#lib/playback";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { useAtom } from "jotai";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useState, type ReactNode } from "react";
import { LogoGlyph } from "./logo-glyph";
import { Switch } from "./switch";

interface HeaderProps {
  title?: string;
  titleClassName?: string;
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
    <Link to="/" className="text-2xl hover:opacity-75">
      <div
        className="group flex *:overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <span style={{ viewTransitionName: "header-title-n" }}>
          <LogoGlyph part="n" />
        </span>
        <CollapsibleLetters show={expanded} vt="header-title-oise">
          <LogoGlyph part="oise" />
        </CollapsibleLetters>
        <span style={{ viewTransitionName: "header-title-d" }}>
          <LogoGlyph part="d" />
        </span>
        <CollapsibleLetters show={expanded} vt="header-title-ex">
          <LogoGlyph part="ex" />
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
          style={{ viewTransitionName: vt }}
        >
          {children}
        </m.span>
      )}
    </AnimatePresence>
  );
}

function PageTitle({ title, titleClassName, titleVt }: HeaderProps) {
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
            style={{ viewTransitionName: titleVt }}
            className={cn("truncate text-2xl", titleClassName)}
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
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(filters.query);
  const value = isHomepage ? filters.query : searchTerm;
  const setValue = isHomepage ? filters.setQuery : setSearchTerm;

  return (
    <form
      style={{ viewTransitionName: "search" }}
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
