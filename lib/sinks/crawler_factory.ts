import { Sink, TargetFactory } from "./";
import { Downloader } from "../helpers/downloader";
import { linkExtractor } from "../helpers/link_extractor";
import { unary } from "lodash/fp";
import { NextFn } from "../common";
import { Target } from "../targets";

export const crawlerFactory = (selector: string) => (mapFn: TargetFactory) => (download: Downloader): Sink<Target> => {
  const extractor = linkExtractor(selector)(download);
  return (next: NextFn) => async (t: Target): Promise<void> => {
    const links = await extractor(t.url);
    links.map(mapFn).forEach(unary(next));
  };
}
