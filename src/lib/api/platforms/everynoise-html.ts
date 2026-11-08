import { trimLinkPostfix } from "./everynoise-data";
import type * as cheerio from "cheerio";

export function readGenreElement(element: cheerio.Cheerio<any>) {
  return {
    genreName: trimLinkPostfix(element.text()),
    color: element.css("color"),
    previewTitle: element.attr("title"),
    previewUrl: element.attr("preview_url"),
  };
}
