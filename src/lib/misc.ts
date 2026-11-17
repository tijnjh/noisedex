import { up } from "up-fetch";

const classifierFetch = up(fetch, () => ({
  baseUrl: "https://classifier.dev",
  parseResponse: (r) => r.text(),
}));

export async function evaluateGenreFontOptions(genreName: string) {
  const font = {
    weight: {
      prompt:
        "you need to classify this genre name according to what 'vibe' it carries, choose one of these font weights that most fits the genre, the genre name is " +
        genreName,
      options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    },

    round: {
      prompt:
        "you need to classify this genre name according to what 'vibe' it carries, choose one of these font rounding options that most fits the genre (0 is non rounded, 100 is fully rounded), the genre name is " +
        genreName,
      options: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    },
  };

  const [weight, round] = await Promise.all([
    classifierFetch(`${font.weight.options.join(",")}/${encodeURIComponent(font.weight.prompt)}`),
    classifierFetch(`${font.round.options.join(",")}/${encodeURIComponent(font.round.prompt)}`),
  ]);

  return {
    weight: Number(weight),
    round: Number(round),
  };
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
