import { AsyncContent } from "#components/async-content";
import { GenreList } from "#components/genre-list";
import type { WikipediaSummary } from "#lib/api/platforms/wikipedia-data";
import { Collapsible } from "@base-ui/react/collapsible";
import { useEffect, useRef, useState } from "react";

const sampleArticle: WikipediaSummary = {
  title: "Wikipedia description",
  extract:
    "Music brings together a wide range of sounds, influences, and traditions. Artists develop their own distinctive styles through recordings and performances. Their work connects musical ideas across generations and reaches listeners around the world. Each release explores new themes and builds on the music that came before it. These influences shape the sound and its place in music history.",
  url: "https://en.wikipedia.org/",
};

export function WikipediaDescription({
  summary,
  genres,
}: {
  summary: Promise<WikipediaSummary | null>;
  genres?: Promise<string[]>;
}) {
  return (
    <>
      <AsyncContent
        promise={summary}
        sample={sampleArticle}
        label="Loading Wikipedia description"
      >
        {(article) =>
          article && <Article key={article.url} article={article} />
        }
      </AsyncContent>

      {genres && (
        <AsyncContent
          promise={genres}
          sample={["alternative rock", "indie rock"]}
          label="Loading Wikipedia genres"
        >
          {(names) => <GenreList title="genres from wikipedia" names={names} />}
        </AsyncContent>
      )}
    </>
  );
}

function Article({ article }: { article: WikipediaSummary }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(true);
  const previewRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const observer = new ResizeObserver(() => {
      setOverflows(preview.scrollHeight > preview.clientHeight + 1);
    });

    observer.observe(preview);
    return () => observer.disconnect();
  }, [article.extract]);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      data-wikipedia-description
    >
      <p
        ref={previewRef}
        aria-hidden={open || undefined}
        data-wikipedia-preview
        className="line-clamp-4 whitespace-pre-line"
      >
        {article.extract}
      </p>

      <Collapsible.Panel data-wikipedia-panel>
        <p className="whitespace-pre-line">{article.extract}</p>
      </Collapsible.Panel>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {(overflows || open) && (
          <Collapsible.Trigger className="btn">
            {open ? "show less" : "show more"}
          </Collapsible.Trigger>
        )}
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="w-fit underline opacity-50 hover:opacity-100"
        >
          read more on wikipedia
        </a>
      </div>
    </Collapsible.Root>
  );
}
