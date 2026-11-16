import { siteName, siteUrl } from "./constants";

export const absoluteUrl = (path: string) => `${siteUrl}${path}`;

interface Page {
  title: string;
  description: string;
  path: string;
}

export function pageHead({ title, description, path }: Page) {
  return {
    meta: [{ title: `${title} • ${siteName}` }, { name: "description", content: description }],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  };
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
  const { meta, links } = pageHead(page);
  const url = absoluteUrl(page.path);

  return {
    meta: [
      ...meta,
      { property: "og:type", content: type },
      { property: "og:title", content: `${page.title} • ${siteName}` },
      { property: "og:description", content: page.description },
      { property: "og:image", content: artwork },
      { property: "og:url", content: url },
    ],
    links,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@id": url,
          url,
          ...jsonLd,
        }).replace(/</g, "\\u003c"),
      },
    ],
  };
}
