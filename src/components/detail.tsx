import type { ReactNode } from "react";

/** one label/value row of a `<dl>` */
export function Detail({
  label,
  className,
  children,
}: {
  label: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={className}>{children}</dd>
    </>
  );
}
