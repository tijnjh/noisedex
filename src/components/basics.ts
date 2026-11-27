import type { PlatformLink } from "#lib/platform-links";
import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";

export const Spinner = <M>(h: Html.H<M>) =>
  h.div.class(
    "size-9 animate-spin rounded-full border-4 border-zinc-300-700 border-t-zinc-600-400",
  );

export const Section = <M, C extends View.Children<M>>(
  h: Html.H<M>,
  options: {
    title: string;
    label?: string | undefined;
    className?: string | undefined;
    children: C;
  },
) =>
  h.section
    .attr("aria-label", options.label)
    .class("flex flex-col gap-3", options.className)
    .children(h.h2.class("section-divider").children(options.title), options.children);

export const Detail = <M, L extends View.Children<M>, C extends View.Children<M>>(
  h: Html.H<M>,
  options: { label: L; className?: string | undefined; children: C },
) => [h.dt.children(options.label), h.dd.class(options.className).children(options.children)];

export const PlatformLinks = <M>(h: Html.H<M>, links: PlatformLink[]) =>
  h.div.class("flex flex-wrap gap-3").children(
    links.map((link) =>
      h.a
        .key(link.href)
        .attrs({ href: link.href, target: "_blank", rel: "noreferrer" })
        .class("btn")
        .children(link.icon && h.img.class("size-5").attrs({ src: link.icon, alt: "" }), link.name),
    ),
  );

const glyphs = {
  n: {
    width: 723,
    d: "M200 930L55 930L55 415L504 415Q592 415 633 459Q673 502 673 573L673 930L528 930L528 590Q528 530 468 530L200 530L200 930Z",
  },
  oise: {
    width: 2608,
    d: "M504 935L319 935Q185 935 110 869Q35 802 35 673Q35 543 110 477Q185 410 319 410L504 410Q638 410 713 477Q788 543 788 673Q788 802 713 869Q638 935 504 935ZM319 820L319 820L504 820Q569 820 604 784Q638 748 638 673Q638 597 604 561Q569 525 504 525L319 525Q254 525 220 561Q185 597 185 673Q185 748 220 784Q254 820 319 820ZM1023 930L878 930L878 415L1023 415L1023 930ZM1024 330L877 330L877 217L1024 217L1024 330ZM1632 935L1116 935L1116 820L1606 820Q1648 820 1648 773Q1648 727 1606 727L1289 727Q1200 727 1154 687Q1108 646 1108 570Q1108 493 1155 452Q1201 410 1289 410L1745 410L1745 525L1296 525Q1253 525 1253 567Q1253 588 1265 600Q1277 612 1296 612L1632 612Q1710 612 1752 653Q1793 693 1793 770Q1793 848 1751 892Q1709 935 1632 935ZM2547 935L2142 935Q2008 935 1933 869Q1858 802 1858 673Q1858 543 1933 477Q2008 410 2142 410L2392 410Q2480 410 2527 452Q2573 493 2573 570Q2573 727 2392 727L2014 727Q2035 820 2142 820L2547 820L2547 935ZM2385 525L2142 525Q2039 525 2015 612L2385 612Q2405 612 2417 600Q2428 588 2428 567Q2428 525 2385 525Z",
  },
  d: {
    width: 744,
    d: "M544 930L689 930L689 215L544 215L544 930ZM319 930L664 930L664 815L319 815Q254 815 220 780Q185 744 185 673Q185 601 220 566Q254 530 319 530L654 530L654 415L319 415Q185 415 110 481Q35 547 35 673Q35 798 110 864Q185 930 319 930Z",
  },
  ex: {
    width: 1486,
    d: "M724 935L319 935Q185 935 110 869Q35 802 35 673Q35 543 110 477Q185 410 319 410L569 410Q657 410 704 452Q750 493 750 570Q750 727 569 727L191 727Q212 820 319 820L724 820L724 935ZM562 525L319 525Q216 525 192 612L562 612Q582 612 594 600Q605 588 605 567Q605 525 562 525ZM935 930L765 930L959 673L765 416L935 416L1084 615L1157 615L1307 416L1476 416L1283 673L1476 930L1307 930L1156 730L1084 730L935 930Z",
  },
};

export const LogoGlyph = <M>(h: Html.H<M>, part: keyof typeof glyphs) => {
  const { width, d } = glyphs[part];

  return h.svg
    .class("block h-lh")
    .attrs({
      "aria-hidden": "true",
      viewBox: `0 0 ${width} 1200`,
      width: `${width / 1000}em`,
      fill: "currentColor",
    })
    .children(h.path.attr("d", d));
};
