import { cn } from "cn";
import type { ReactNode } from "react";

export function Section({
  title,
  label,
  className,
  children,
}: {
  title: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className={cn("flex flex-col gap-3", className)}>
      <h2 className="section-divider">{title}</h2>
      {children}
    </section>
  );
}
