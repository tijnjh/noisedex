import { vtName } from "#lib/utils";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "cn";
import type { ReactNode } from "react";

export function Chip({
  children,
  leading,
  trailing,
  inverse,
  className,
  vt,
  ...props
}: LinkProps & {
  children?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  inverse?: boolean;
  className?: string;
  vt?: { img?: string; title?: string };
}) {
  return (
    <div className="flex h-control items-center">
      {typeof leading === "string" ? (
        <img
          {...vtName`${vt?.img}`}
          className="aspect-square size-control"
          src={leading}
          alt=""
        />
      ) : (
        leading
      )}

      <Link
        {...props}
        draggable={false}
        className={cn(
          "min-w-0 grow items-center px-0 [-webkit-touch-callout:none]",
          inverse ? "btn-inverse" : "btn",
          className,
        )}
      >
        <span {...vtName`${vt?.title}`} className="truncate px-3" title={children}>
          {children}
        </span>
      </Link>

      {trailing}
    </div>
  );
}
