import type { ReactNode } from "react";

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
