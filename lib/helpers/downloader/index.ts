import fetch, { Response } from "node-fetch";
import AbortController from "node-abort-controller";
import { times } from "lodash";

interface Download {
  url: string;
  complete: boolean;
  success: boolean;
  resolve: (res: Response) => void;
  reject: (err?: Error) => void;
}

type DownloadQueue = Download[];

type CloseFn = () => void;

export interface DownloadPool {
  download: (url: string) => Promise<Response>;
  close: () => void;
}

export class PoolClosedError extends Error {
  url?: string;

  constructor(url?: string) {
    const message = url ? `Pool was closed before download (${url}) could complete`
                        : "Pool was closed";
    super(message);
    Object.setPrototypeOf(this, PoolClosedError.prototype);
    if(url) this.url = url;
  }
}

const createDownloadWorker = (queue: DownloadQueue, interval: number): CloseFn => {
  let timer: NodeJS.Timeout,
      controller: AbortController,
      download: Download,
      closed = false;
  const act = async () => {
    if(closed) return;
    if(queue.length > 0) {
      controller = new AbortController();
      download = queue.shift();
      try {
        download.resolve(
          await fetch(download.url, { signal: controller.signal })
        );
      } catch(e) {
        download.reject(e);
      } finally {
        timer = setTimeout(act, interval);
      }
    } else {
      timer = setTimeout(act, interval);
    }
  };
  act();
  return () => {
    closed = true;
    controller?.abort();
    download?.reject(new PoolClosedError(download.url));
    if(timer) clearTimeout(timer);
  }
};

export function createDownloadPool(size: number, pollInterval = 100): DownloadPool {
  let closed = false;
  const queue: DownloadQueue = [];
  const pool = times(size, () => createDownloadWorker(queue, pollInterval));
  const download = (url: string): Promise<Response> => {
    if(closed) throw new PoolClosedError();
    const dl: Partial<Download> = { url };
    const resp: Promise<Response> = new Promise((resolve, reject) => {
      dl.resolve = (response: Response) => {
        dl.complete = true;
        dl.success = true;
        resolve(response);
      };
      dl.reject = (err?: Error) => {
        dl.complete = true;
        dl.success = false;
        reject(err);
      };
    });
    queue.push(dl as Download);
    return resp;
  };

  const close = () => {
    closed = true;
    pool.forEach((close) => close());
    queue.filter((dl) => !dl.complete).forEach((dl) => dl.reject(new PoolClosedError(dl.url)));
  };

  return { download, close };
}