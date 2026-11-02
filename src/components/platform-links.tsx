import { type Linkable, platformLinksFor } from "#lib/platform-links";
import { For, Show } from "solid-js";

export function PlatformLinks(props: { for: Linkable }) {
  return (
    <div class="flex flex-wrap gap-3">
      <For each={platformLinksFor(props.for)}>
        {(link) => (
          <a href={link.href} class="btn" target="_blank">
            <Show when={link.icon}>
              {(icon) => <img class="size-5" src={icon()} />}
            </Show>
            {link.name}
          </a>
        )}
      </For>
    </div>
  );
}
