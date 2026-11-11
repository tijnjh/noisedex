import { Chip } from "#components/chip";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";

export function GenreList({
  title,
  names,
}: {
  title: string;
  names: string[];
}) {
  if (!names.length) return;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-divider">{title}</h2>
      <div className="cool-grid">
        {names.map((name) => (
          <Chip
            key={name}
            to="/genre/$slug"
            params={{ slug: genreNameToSlug(name.toLowerCase()) }}
          >
            {name.toLowerCase()}
          </Chip>
        ))}
      </div>
    </section>
  );
}
