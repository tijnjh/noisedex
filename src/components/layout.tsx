import { JSX } from "@solidjs/web";
import { Link } from "@tanstack/solid-router";
import { cn } from "cn";
import { children, ComponentProps, createMemo, Show } from "solid-js";
import { MergeExclusive } from "type-fest";

export function Layout(
  props: { header: ComponentProps<typeof Header> } & MergeExclusive<
    { children?: JSX.Element },
    { leading: JSX.Element; trailing: JSX.Element }
  >,
) {
  const header = createMemo(() => props.header);
  const content = children(() => props.children);

  return (
    <div class="grid grid-rows-[1fr_auto] overflow-hidden md:grid-rows-[auto_1fr]">
      <Header {...header()} />

      <div class={cn("grid overflow-y-auto", !content() && "p-3")}>
        <Show
          when={content()}
          fallback={
            <>
              <Title title={header().title} />

              <main class="grid h-full grid-cols-1 gap-6 max-lg:content-start lg:grid-cols-[auto_1fr] lg:overflow-hidden">
                <div class="flex w-full flex-col gap-3 lg:min-h-0 lg:w-115 lg:overflow-y-auto">
                  {props.leading}
                </div>
                {props.trailing}
              </main>
            </>
          }
        >
          <main class="flex min-h-0 flex-col overflow-hidden">
            <div class="px-3 pt-3 md:hidden">
              <Title title={header().title} />
            </div>
            <div class="min-h-0 flex-1 overflow-hidden">{content()}</div>
          </main>
        </Show>
      </div>
    </div>
  );
}

function Title(props: { title: string }) {
  return (
    <h1 class="mb-3 h-9 truncate text-2xl font-bold md:hidden">
      {props.title}
    </h1>
  );
}

export function Header(props: {
  backHref?: string;
  title: string;
  children?: JSX.Element;
}) {
  const content = children(() => props.children);

  return (
    <header
      class={cn([
        "flex gap-3 overflow-hidden border-zinc-300-700 p-3 max-md:order-1 max-md:flex-col max-md:border-t md:h-15 md:items-center md:justify-between md:border-b",
        !props.backHref && !content() && "max-md:hidden",
      ])}
    >
      <div
        class={cn(
          "flex items-center gap-3",
          !props.backHref && "max-md:hidden",
        )}
      >
        <Show when={props.backHref}>
          {(to) => (
            <Link to={to()} class="btn-inverse size-9 justify-center">
              ←
            </Link>
          )}
        </Show>
        <h1 class="truncate text-2xl font-bold max-md:hidden">{props.title}</h1>
      </div>

      {content()}
    </header>
  );
}
