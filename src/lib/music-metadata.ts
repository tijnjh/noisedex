export function musicMetadata({
  title,
  description,
  url,
  artwork,
  type,
  recording,
}: {
  title: string;
  description: string;
  url: string;
  artwork: string;
  type: "music.album" | "music.song";
  recording: Record<string, unknown>;
}) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: artwork },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@id": url,
          url,
          ...recording,
        }).replace(/</g, "\\u003c"),
      },
    ],
  };
}
