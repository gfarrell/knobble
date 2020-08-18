import { JSDOM } from "jsdom";
import { Downloader, DownloadError } from "../downloader";

type ElProcFn<T> = (el: HTMLElement) => T;
type ElementExtractorFactory<T> = (selector: string) => ElementExtractor<T>;
export type ElementExtractor<T> = (download: Downloader) => (url: string) => Promise<T>;

export function elementExtractor<T>(mapFn: ElProcFn<T>): ElementExtractorFactory<T[]> {
  return (selector: string) => (download: Downloader) => async (url: string): Promise<T[]> => {
    const response = await download(url);
    if(!response.ok) throw new DownloadError(url, response.status);
    const tree = new JSDOM(await response.text());
    return Array.from(
      tree.window.document.querySelectorAll(selector)
    ).map(mapFn);
  };
}
