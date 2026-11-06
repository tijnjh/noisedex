import type { WikipediaSummary } from "#lib/api/platforms/wikipedia";
import { genreNameToSlug } from "#lib/utils";
import { Await, Link } from "@tanstack/react-router";

export function WikipediaDescription({
  summary,
  genres,
}: {
  summary: Promise<WikipediaSummary | null>;
  genres?: Promise<string[]>;
}) {
  return (
    <>
      <Await
        promise={summary}
        fallback={
          <p role="status" className="text-sm opacity-50">
            loading wikipedia description…
          </p>
        }
      >
        {(article) =>
          article && (
            <div className="flex flex-col gap-2">
              <p className="whitespace-pre-line">{article.extract}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="underline opacity-50 hover:opacity-100"
              >
                read more on wikipedia
              </a>
            </div>
          )
        }
      </Await>

      {genres && (
        <Await
          promise={genres}
          fallback={
            <p role="status" className="text-sm opacity-50">
              Loading Wikipedia genres…
            </p>
          }
        >
          {(names) =>
            names.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="section-divider">genres from wikipedia</h2>

                <ul className="cool-grid">
                  {names.map((name) => (
                    <Link
                      to="/genre/$slug"
                      params={{ slug: genreNameToSlug(name.toLowerCase())! }}
                      key={name}
                      className="btn"
                    >
                      {name.toLowerCase()}
                    </Link>
                  ))}
                </ul>
              </section>
            )
          }
        </Await>
      )}
    </>
  );
}
