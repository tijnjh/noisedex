import { Chip } from "#components/chip";
import { Section } from "#components/section";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";

export function GenreList({
  title,
  names,
  className,
}: {
  title: string;
  names: string[];
  className?: string;
}) {
  if (!names.length) return;

  return (
    <Section title={title} className={className}>
      <div className="cool-grid">
        {names.map((name) => (
          <Chip
            key={name}
            className="lowercase"
            to="/genre/$slug"
            params={{ slug: genreNameToSlug(name) }}
          >
            {name}
          </Chip>
        ))}
      </div>
    </Section>
  );
}
