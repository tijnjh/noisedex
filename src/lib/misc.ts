import type { CSSProperties } from "react";
import { up } from "up-fetch";
import { match } from "matchexpr";

const classifierFetch = up(fetch, () => ({
  baseUrl: "https://classifier.dev",
}));

interface ClassifyResponse<Dimension extends string> {
  results: { dimensions: Record<Dimension, { label: string }> }[];
}

export async function evaluateGenreFontOptions(genreName: string) {
  const vibe = "you need to classify this music genre name according to what 'vibe' it carries, ";

  const dimensions = {
    weight: {
      labels: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
      instructions: vibe + "choose the font weight that most fits the genre",
    },
    round: {
      labels: ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
      instructions:
        vibe +
        "choose the font rounding that most fits the genre (0 is non rounded, 100 is fully rounded)",
    },
    style: {
      labels: [...fontStyles],
      instructions:
        vibe +
        "choose the font style that most fits the genre (sans is clean and modern, serif is classic and elegant, mono is technical and mechanical)",
    },
    italic: {
      labels: ["upright", "italic"],
      instructions: vibe + "choose whether the genre name fits best set upright or in italics",
    },
  };

  const response = await classifierFetch<ClassifyResponse<keyof typeof dimensions>>(
    "/v1/classify",
    { method: "POST", body: { items: [genreName], dimensions } },
  );
  const { weight, round, style, italic } = response.results[0]!.dimensions;

  return {
    weight: Number(weight.label),
    round: Number(round.label),
    style: fontStyles.find((s) => s === style.label) ?? "sans",
    italic: italic.label === "italic",
  };
}

const fontStyles = ["sans", "serif", "mono"] as const;

export type GenreFontOptions = Awaited<ReturnType<typeof evaluateGenreFontOptions>>;

export function genreFontStyle({ weight, round, style, italic }: GenreFontOptions): CSSProperties {
  return match(style, {
    serif: () => ({
      fontFamily: "var(--font-serif)",
      fontWeight: weight,
      fontStyle: italic ? "italic" : "normal",
      fontVariationSettings: `"SOFT" ${round}`,
    }),
    mono: () => ({
      fontFamily: "var(--font-mono)",
      fontWeight: weight,
      fontStyle: italic ? "oblique 15deg" : "normal",
      fontVariationSettings: `"MONO" 1, "CASL" ${round / 100}`,
    }),
    sans: () => ({
      fontWeight: weight,
      fontStyle: italic ? "italic" : "normal",
      fontVariationSettings: `"ROND" ${round}`,
    }),
  });
}
