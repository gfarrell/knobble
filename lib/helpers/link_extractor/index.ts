import { JSDOM } from "jsdom";
import { Response } from "node-fetch";

interface Downloader {
  (url: string): Promise<Response>
}

export class DownloadError extends Error {
  url: string;
  status: number;

  constructor(url: string, status: number) {
    super(`Unable to download ${url}, status ${status}`);
    Object.setPrototypeOf(this, DownloadError.prototype);
    this.url = url;
    this.status = status;
  }
}

export const linkExtractor = (download: Downloader) => (selector: string) => async (url: string): Promise<string[]> => {
  const response = await download(url);
  if(!response.ok) throw new DownloadError(url, response.status);
  const tree = new JSDOM(await response.text());
  return Array.from(tree.window.document.querySelectorAll(selector))
    .map((link) => link.getAttribute("href"))
    .map(decodeURI);
};
