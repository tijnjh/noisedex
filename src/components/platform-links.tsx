import type { PlatformLink } from "#lib/platform-links";

export function PlatformLinks({ links }: { links: PlatformLink[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="btn"
          target="_blank"
          rel="noreferrer"
        >
          {link.icon && <img className="size-5" src={link.icon} alt="" />}
          {link.name}
        </a>
      ))}
    </div>
  );
}
