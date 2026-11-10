import { scrollRegions } from "#lib/scroll-regions";
import { vtName } from "#lib/utils";
import { cn } from "cn";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
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
> & { accentColor?: string }) {
  return (
    <div
      className="relative isolate grid grid-rows-[1fr_auto] overflow-hidden md:grid-rows-[auto_1fr]"
      style={{ "--page-accent": accentColor } as CSSProperties}
    >
      {accentColor && <div data-page-backdrop aria-hidden="true" />}
      <Header {...header} />

      <div
        data-scroll-restoration-id={scrollRegions.page}
        className={cn("grid overflow-y-auto", !children && "p-3")}
      >
        {children ? (
          <main className="flex min-h-0 flex-col overflow-hidden">
            <div className="px-3 pt-3 md:hidden">
              <Title title={header.title} titleVt={header.titleVt} />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </main>
        ) : (
          <>
            <Title title={header.title} titleVt={header.titleVt} />

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
    <h1
      {...vtName`${titleVt}`}
      className="mb-3 h-9 truncate text-2xl font-bold md:hidden md:w-fit"
    >
      {title}
    </h1>
  );
}

function Header({
  title,
  titleVt,
  children,
}: {
  title: string;
  titleVt?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex gap-3 overflow-hidden p-3 max-md:order-1 max-md:flex-col md:h-15 md:items-center md:justify-between",
        !children && "max-md:hidden",
      )}
    >
      <div className={cn("flex items-center gap-3 max-md:hidden")}>
        <h1
          {...vtName`${titleVt}`}
          className="truncate text-2xl font-bold max-md:hidden"
        >
          {title}
        </h1>
      </div>

      {children}
    </header>
  );
}
