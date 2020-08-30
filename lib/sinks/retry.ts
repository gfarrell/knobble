import { Sink } from "./";
import { Target } from "../targets";
import { NextFn } from "../common";

const resetFactory = (list: Record<string, number>) => (url: string): void => {
  list[url] = 0;
}
const incFactory = (list: Record<string, number>) => (url: string): void => {
  if(!(url in list)) {
    resetFactory(list)(url);
  }
  list[url]++;
}
const getFactory = (list: Record<string, number>) => (url: string): number => {
  return list[url] ?? 0;
}

export class MaxRetriesExceededError extends Error {
  url: string;
  originalError: Error;

  constructor(url: string, originalError: Error) {
    super(`Max number of retries exceeded for ${url}, original error: ${originalError.message}`);
    Object.setPrototypeOf(this, MaxRetriesExceededError.prototype);
    this.url = url;
    this.originalError = originalError;
  }
}

export const RetrySink = <T extends Target, S extends Sink<T>>(retryCount: number) => (baseSink: S): Sink<T> => {
  const retryList: Record<string, number> = {};

  const get = getFactory(retryList);
  const inc = incFactory(retryList);
  const reset = resetFactory(retryList);

  return (next: NextFn) => async (t: T): Promise<void> => {
    try {
      await baseSink(next)(t);
      reset(t.url);
    } catch(err) {
      inc(t.url);
      if(get(t.url) > retryCount) {
        throw new MaxRetriesExceededError(t.url, err);
      }
      next(t);
    }
  };
};
