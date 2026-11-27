import { Head } from "@effect/ui";
import { HtmlHead } from "@effect/ui/html";
import { siteName, siteUrl } from "./constants.ts";

export const absoluteUrl = (path: string) => `${siteUrl}${path}`;

interface Page {
  title: string;
  description: string;
  path: string;
}

export const canonical = (path: string) =>
  HtmlHead.link({ rel: "canonical", href: absoluteUrl(path) });

export function pageHead({ title, description, path }: Page) {
  return [
    Head.title(`${title} • ${siteName}`),
    HtmlHead.meta({ name: "description", content: description }),
    canonical(path),
  ];
}

export function musicHead({
  artwork,
  type,
  jsonLd,
  ...page
}: Page & {
  artwork: string;
  type: "music.album" | "music.song";
  jsonLd: Record<string, unknown>;
}) {
  const url = absoluteUrl(page.path);

  return [
    ...pageHead(page),
    HtmlHead.meta({ property: "og:type", content: type }),
    HtmlHead.meta({ property: "og:title", content: `${page.title} • ${siteName}` }),
    HtmlHead.meta({ property: "og:description", content: page.description }),
    HtmlHead.meta({ property: "og:image", content: artwork }),
    HtmlHead.meta({ property: "og:url", content: url }),
    // through json, which drops the fields that are undefined
    HtmlHead.jsonLd(
      JSON.parse(
        JSON.stringify({ "@context": "https://schema.org", "@id": url, url, ...jsonLd }),
      ) as object,
    ),
  ];
}
