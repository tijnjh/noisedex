import fantanoReviews from "../../../data/fantano-reviews.json" with { type: "json" };
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

export const getReview = createServerFn()
  .validator(
    v.object({
      artist: v.string(),
      album: v.string(),
    }),
  )
  .handler(({ data: { artist, album } }) =>
    fantanoReviews.find((review) => review.title === `${artist} - ${album}`),
  );
