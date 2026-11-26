import { extractArtworkColors } from "./artwork-color.server";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

export const getArtworkColors = createServerFn()
  .validator(v.string())
  .handler(({ data }) => extractArtworkColors(data));
