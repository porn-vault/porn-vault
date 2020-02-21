import Image from "../../../types/image";
import extractQueryOptions, { SortTarget } from "../../../query_extractor";
import * as logger from "../../../logger";
import * as search from "../../../search/index";
import { IImageSearchDoc, searchImages } from "../../../search/image";
import Axios from "axios";

const PAGE_SIZE = 24;

export async function getImages(
  _,
  { query, auto }: { query: string | undefined; auto?: boolean | null }
) {
  try {
    const timeNow = +new Date();

    const res = await searchImages(query || "");

    // Filter thumbnails, screenshots, previews
    // TODO: reimplement in twigs
    /* if (!auto)
     filters.push(doc =>
       [
         "(thumbnail)",
         "(preview)",
         "(screenshot)",
         "(front cover)",
         "(back cover)"
       ].every(ending => !doc.name.endsWith(ending))
     ); */

    const images = await Promise.all(
      res.data.items.map(i => Image.getById(i.id))
    );
    logger.log(`Search done in ${(Date.now() - timeNow) / 1000}s.`);
    return images.filter(Boolean);
  } catch (error) {
    logger.error(error);
  }
}
