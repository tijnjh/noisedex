import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Chip({
  children,
  artwork,
  trailing,
  className,
  vt,
  containerProps,
  ...props
}: LinkProps & {
  children?: string;
  artwork?: string;
  trailing?: ReactNode;
  className?: string;
  // view transition names
  vt?: { img?: string; title?: string };
  containerProps?: HTMLAttributes<HTMLElement>;
}) {
  return (
    <div {...containerProps} className="flex h-control items-center truncate">
      {artwork && (
        <img
          style={{ viewTransitionName: vt?.img }}
          className="aspect-square size-control"
          src={artwork}
          loading="lazy"
          decoding="async"
          alt=""
        />
      )}

      <Link {...props} draggable={false} className={cn("btn min-w-0 grow px-0", className)}>
        <span style={{ viewTransitionName: vt?.title }} className="truncate px-3">
          {children}
        </span>
      </Link>

      {trailing}
    </div>
  );
}
