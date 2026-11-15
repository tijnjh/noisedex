import { viewTransition } from "#lib/utils";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Chip({
  children,
  leading,
  trailing,
  className,
  vt,
  containerProps,
  ...props
}: LinkProps & {
  children?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  vt?: { img?: string; title?: string };
  containerProps?: HTMLAttributes<HTMLElement>;
}) {
  return (
    <div {...containerProps} className="flex h-control items-center truncate">
      {typeof leading === "string" ? (
        <img
          {...viewTransition(vt?.img)}
          className="aspect-square size-control"
          src={leading}
          loading="lazy"
          decoding="async"
          alt=""
        />
      ) : (
        leading
      )}

      <Link
        {...props}
        draggable={false}
        className={cn("btn min-w-0 grow items-center px-0 [-webkit-touch-callout:none]", className)}
      >
        <span {...viewTransition(vt?.title)} className="truncate px-3">
          {children}
        </span>
      </Link>

      {trailing}
    </div>
  );
}
