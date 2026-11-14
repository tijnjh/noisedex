import { Layout } from "#components/layout";
import { getErrorMessage } from "#lib/utils";
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

function StatusPage({
  code,
  title,
  children,
  actions,
}: {
  code: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Layout header={{}}>
      <div className="grid h-full place-items-center overflow-y-auto p-3">
        <div className="flex w-full max-w-md flex-col items-start gap-3">
          <span aria-hidden="true" className="font-logo text-7xl opacity-20 md:text-8xl">
            {code}
          </span>

          <h1 className="text-4xl text-balance md:text-5xl">{title}</h1>

          <div className="flex flex-col gap-3 text-pretty opacity-75">{children}</div>

          <div className="mt-3 flex flex-wrap gap-3">
            {actions}
            <Link to="/" className={actions ? "btn" : "btn-inverse"}>
              browse genres
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function NotFoundPage() {
  return (
    <StatusPage code="404" title="never heard of it">
      <p>
        there's no genre, artist, album or track at this address. the link might be off-key, or
        whatever lived here is gone.
      </p>
      <p>try the search bar up top, or start over from the genre list.</p>
    </StatusPage>
  );
}

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <StatusPage
      code="err"
      title="that hit a wrong note"
      actions={
        <button
          type="button"
          className="btn-inverse"
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          try again
        </button>
      }
    >
      <p>something broke while loading this page. it's usually temporary, so give it another go.</p>
      <p role="alert" className="font-mono text-sm wrap-anywhere">
        {getErrorMessage(error)}
      </p>
    </StatusPage>
  );
}
