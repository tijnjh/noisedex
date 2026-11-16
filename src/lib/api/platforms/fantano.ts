import fantanoReviews from "../../../data/fantano-reviews.json" with { type: "json" };
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

interface Review {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  url: string;
  updated_at: string;
  visibility: string;
}

export const getReview = createServerFn()
  .validator(
    v.object({
      artist: v.string(),
      album: v.string(),
    }),
  )
  .handler(({ data: { artist, album } }) =>
    (fantanoReviews as Review[]).find((review) => review.title === `${artist} - ${album}`),
  );
