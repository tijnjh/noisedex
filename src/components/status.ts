import { Spinner } from "#components/basics";
import { Layout } from "#components/layout";
import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import type { AppRoute } from "../routes.ts";
import { indexUrl } from "../routes.ts";

export const StatusPage = <
  M,
  C extends View.Children<M>,
  A extends View.Children<M> = [],
  X extends View.Children<M> = [],
>(
  h: Html.H<M>,
  options: {
    route: AppRoute;
    code: string;
    title: string;
    children: C;
    actions?: A | undefined;
    extra?: X | undefined;
  },
) =>
  Layout(h, {
    key: "layout",
    props: { route: options.route },
    slots: {
      content: [
        h.div.class("grid h-full place-items-center overflow-y-auto p-3").children(
          h.div.class("flex w-full max-w-md flex-col items-start gap-3").children(
            h.span
              .attr("aria-hidden", "true")
              .class("text-7xl opacity-20 md:text-8xl")
              .children(options.code),
            h.h1.class("text-4xl text-balance md:text-5xl").children(options.title),
            h.div.class("flex flex-col gap-3 text-pretty opacity-75").children(options.children),
            options.extra,
            h.div.class("mt-3 flex flex-wrap gap-3").children(
              options.actions,
              h.a
                .attr("href", indexUrl)
                .class(options.actions ? "btn" : "btn-inverse")
                .children("browse genres"),
            ),
          ),
        ),
      ],
    },
  });

// the stand-in while a page's data loads
export const LoadingPage = <M>(h: Html.H<M>, route: AppRoute, label: string) =>
  Layout(h, {
    key: "layout",
    props: { route },
    slots: {
      content: [
        h.div
          .attrs({ role: "status", "aria-label": label })
          .class("grid h-full place-items-center")
          .children(Spinner(h)),
      ],
    },
  });

export const NotFoundPage = <M>(h: Html.H<M>, route: AppRoute) =>
  StatusPage(h, {
    route,
    code: "404",
    title: "page not found",
    children: [
      h.p.children(
        "there's no genre, artist, album or track at this address. try searching for it instead.",
      ),
    ],
  });

export const ErrorPage = <M>(
  h: Html.H<M>,
  options: { route: AppRoute; error: string; onRetry: M },
) =>
  StatusPage(h, {
    route: options.route,
    code: "err",
    title: "something went wrong",
    actions: [
      h.button
        .attr("type", "button")
        .class("btn-inverse")
        .on("click", options.onRetry)
        .children("try again"),
    ],
    children: [
      h.p.children("this page failed to load. it's usually temporary, so try again in a moment."),
      h.p.attr("role", "alert").class("font-mono text-sm wrap-anywhere").children(options.error),
    ],
  });
