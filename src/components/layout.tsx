import { fixRelativeUrl } from "#lib/utils";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import type { ComponentProps, ReactNode } from "react";
import type { MergeExclusive } from "type-fest";

export function Layout({
  header,
  children,
  leading,
  trailing,
}: { header: ComponentProps<typeof Header> } & MergeExclusive<
  { children?: ReactNode },
  { leading: ReactNode; trailing: ReactNode }
>) {
  return (
    <div className="grid grid-rows-[1fr_auto] overflow-hidden md:grid-rows-[auto_1fr]">
      <Header {...header} />

      <div className={cn("grid overflow-y-auto", !children && "p-3")}>
        {children ? (
          <main className="flex min-h-0 flex-col overflow-hidden">
            <div className="px-3 pt-3 md:hidden">
              <Title title={header.title} />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </main>
        ) : (
          <>
            <Title title={header.title} />

            <main className="grid h-full grid-cols-1 gap-6 max-lg:content-start lg:grid-cols-[auto_1fr] lg:overflow-hidden">
              <div className="flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto">
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

function Title({ title }: { title: string }) {
  return (
    <h1 className="mb-3 h-9 truncate text-2xl font-bold md:hidden">{title}</h1>
  );
}

export function Header({
  backHref,
  title,
  links,
  children,
}: {
  backHref?: string;
  title: string;
} & MergeExclusive<
  { links?: Array<{ text: string; href: string }> },
  { children: ReactNode }
>) {
  // This button is too wide and doesn't provide much functionality here.
  const visibleLinks = links?.filter(
    (link) => link.text !== "Every Noise at Once",
  );

  return (
    <header
      className={cn(
        "flex gap-3 overflow-hidden border-zinc-300-700 p-3 max-md:order-1 max-md:flex-col max-md:border-t md:h-15 md:items-center md:justify-between md:border-b",
        !backHref && !children && "max-md:hidden",
      )}
    >
      <div
        className={cn("flex items-center gap-3", !backHref && "max-md:hidden")}
      >
        {backHref && (
          <Link
            to={backHref}
            aria-label="Back"
            className="btn-inverse size-9 justify-center"
          >
            ←
          </Link>
        )}
        <h1 className="truncate text-2xl font-bold max-md:hidden">{title}</h1>
      </div>

      {children ||
        (Boolean(visibleLinks?.length) && (
          <ul className="flex scrollbar-none gap-3 overflow-x-auto">
            {visibleLinks?.map((link) => (
              <li key={link.href} className="first:ml-3 last:mr-3">
                <a
                  href={fixRelativeUrl(link.href)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-inverse"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        ))}
    </header>
  );
}
