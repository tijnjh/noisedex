import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "cn";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export function Chip({
  children,
  subtitle,
  artwork,
  trailing,
  tint,
  className,
  vt,
  containerProps,
  ...props
}: LinkProps & {
  children?: string;
  subtitle?: string;
  artwork?: string;
  trailing?: ReactNode;
  // tints the background and border, e.g. with the genre color
  tint?: string;
  className?: string;
  // view transition names
  vt?: { img?: string; title?: string };
  containerProps?: HTMLAttributes<HTMLElement>;
}) {
  return (
    <div
      {...containerProps}
      className={cn("flex items-center truncate", subtitle ? "h-12" : "h-control")}
    >
      {artwork && (
        <img
          style={{ viewTransitionName: vt?.img }}
          className={cn("aspect-square", subtitle ? "size-12" : "size-control")}
          src={artwork}
          loading="lazy"
          decoding="async"
          alt=""
        />
      )}

      <Link
        {...props}
        draggable={false}
        className={cn(
          "btn min-w-0 grow px-0",
          subtitle && "h-full",
          tint && "chip-tinted",
          className,
        )}
        style={tint ? ({ "--chip-color": tint } as CSSProperties) : undefined}
      >
        {subtitle ? (
          <span className="flex min-w-0 flex-col px-3 leading-tight">
            <span style={{ viewTransitionName: vt?.title }} className="truncate">
              {children}
            </span>
            <span className="truncate text-sm opacity-60">{subtitle}</span>
          </span>
        ) : (
          <span style={{ viewTransitionName: vt?.title }} className="truncate px-3">
            {children}
          </span>
        )}
      </Link>

      {trailing}
    </div>
  );
}
