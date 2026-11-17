import type { CSSProperties } from "react";
import { up } from "up-fetch";

const classifierFetch = up(fetch, () => ({
  baseUrl: "https://classifier.dev",
}));

interface ClassifyResponse<Dimension extends string> {
  results: { dimensions: Record<Dimension, { label: string }> }[];
}

// one request that picks a label per dimension, the free tier only runs 4 requests per IP at once
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

// each style maps roundness (0-100) onto its own font's closest axis
export function genreFontStyle({ weight, round, style, italic }: GenreFontOptions): CSSProperties {
  switch (style) {
    case "serif":
      return {
        fontFamily: "var(--font-serif)",
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        fontVariationSettings: `"SOFT" ${round}`,
      };
    case "mono":
      return {
        fontFamily: "var(--font-mono)",
        fontWeight: weight,
        // recursive has no italic face, it slants along its slnt axis (and turns cursive at full slant)
        fontStyle: italic ? "oblique 15deg" : "normal",
        fontVariationSettings: `"MONO" 1, "CASL" ${round / 100}`,
      };
    default:
      return {
        fontWeight: weight,
        // allo's obliques are static faces, so roundness only applies upright
        fontStyle: italic ? "italic" : "normal",
        fontVariationSettings: `"ROND" ${round}`,
      };
  }
}

// export const evaluateGenreFontOptions = createServerFn()
//   .validator(v.string())
//   .handler(async ({ data: genreName }) => {
//     // const weightPrompt =
//     //   "you need to classify this genre name according to what 'vibe' it carries, choose one of these font weights that most fits the genre, the genre name is " +
//     //   genreName;

//     // const weights =

//     const font = {
//       weight: {
//         prompt:
//           "you need to classify this genre name according to what 'vibe' it carries, choose one of these font weights that most fits the genre, the genre name is " +
//           genreName,
//         options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
//       },

//       round: {
//         prompt:
//           "you need to classify this genre name according to what 'vibe' it carries, choose one of these font rounding options that most fits the genre (0 is non rounded, 100 is fully rounded), the genre name is " +
//           genreName,
//         options: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
//       },
//     };

//     const [weight, round] = await Promise.all([
//       classifierFetch(`${font.weight.options.join(",")}/${encodeURIComponent(font.weight.prompt)}`),
//       classifierFetch(`${font.round.options.join(",")}/${encodeURIComponent(font.round.prompt)}`),
//     ]);

//     return {
//       weight: Number(weight),
//       round: Number(round),
//     };
//   });
