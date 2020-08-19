import { Target } from "../targets";
import { NextFn } from "../common";
import { Downloader } from "../helpers/downloader";
import { linkExtractor } from "../helpers/link_extractor";
import { unary } from "lodash/fp";

export type FilterFn = (t: Target) => boolean;

export const AddFilter = (filter: FilterFn) => (sink: Sink): Sink => {
  return (next: NextFn): (t: Target) => Promise<void> => {
    const sinkhole = sink(next);
    return async (t: Target): Promise<void> => {
      if(filter(t)) return await sinkhole(t);
    };
  };
};

export interface Sink {
  (next: NextFn): (t: Target) => Promise<void>
}

type TargetFactory = (url: string) => Target;

export const crawlerFactory = (selector: string) => (mapFn: TargetFactory) => (download: Downloader): Sink => {
  const extractor = linkExtractor(selector)(download);
  return (next: NextFn) => async (t: Target): Promise<void> => {
    const links = await extractor(t.url);
    links.map(mapFn).forEach(unary(next));
  };
}
