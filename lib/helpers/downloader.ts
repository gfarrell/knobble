import fetch, { Response, RequestInfo } from "node-fetch";

let CONN_COUNT = 0;
const MAX_CONN = 25;
const RETRY_INT = 25;
const TIMEOUT = 3600000;

export class TimeoutError extends Error {
  constructor() {
    super("Timed out when waiting for download pool availability.");
  }
}

const randomWait = (): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, Math.round(Math.random()*45 + 5));
});

const waitForPool = (): Promise<void> => new Promise((resolve, reject) => {
  if(CONN_COUNT < MAX_CONN) {
    resolve();
  } else {
    const timer = setInterval(() => {
      if(CONN_COUNT < MAX_CONN) {
        clearInterval(timer);
        clearTimeout(timeout);
        resolve();
      }
    }, RETRY_INT);
    const timeout = setTimeout(() => {
      clearInterval(timer);
      reject(new TimeoutError());
    }, TIMEOUT);
  }
});

const inc = (): number => ++CONN_COUNT;
const dec = (): number => --CONN_COUNT;

export async function download(url: RequestInfo): Promise<Response> {
  await waitForPool();
  try {
    inc();
    await randomWait();
    return await fetch(encodeURI(url));
  } catch(e) {
    console.error("[!] Failed to fetch", url);
    throw e;
  } finally {
    dec();
  }
}
