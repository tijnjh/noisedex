import { Await } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SkeletonSuspense } from "skullet/react";

export function AsyncContent<T>({
  promise,
  sample,
  label,
  children,
}: {
  promise: Promise<T>;
  sample: T;
  label: string;
  children: (data: T) => ReactNode;
}) {
  return (
    <SkeletonSuspense label={label} skeleton={children(sample)}>
      <Await promise={promise}>{children}</Await>
    </SkeletonSuspense>
  );
}
