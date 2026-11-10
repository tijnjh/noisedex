import { extractArtworkColor } from "./artwork-color.server";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

export const getArtworkColor = createServerFn()
  .validator(v.string())
  .handler(({ data }) => extractArtworkColor(data));
