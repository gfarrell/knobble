import { JSDOM } from "jsdom";
import { download } from "../helpers/downloader";

export class DownloadError extends Error {
  url: string;
  status: number;

  constructor(url: string, statusCode: number) {
    super(`Unable to download url (${statusCode}): ${url}`);
    this.url = url;
    this.status = statusCode;
  }
}

export const linkExtractor = (selector: string) => async (url: string): Promise<string[]> => {
  const response = await download(url);
  if(!response.ok) {
    throw new DownloadError(url, response.status);
  }
  const tree = new JSDOM(await response.text());
  return Array.from(tree.window.document.querySelectorAll(selector))
    .map((link) => link.getAttribute("href"))
    .map((encoded) => decodeURI(encoded));
}
