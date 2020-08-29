import { Target } from "../targets";
import { NextFn } from "../common";
import { Sink } from "./";

export type FilterFn = (t: Target) => boolean;

interface TargetConstructor<T extends Target> {
  new (...args: unknown[]): T
}

export const TargetTypeFilter = <T extends Target>(constructor: TargetConstructor<T>) => (sink: Sink<T>): Sink<Target> => {
  return (next: NextFn): (t: Target) => Promise<void> => {
    const sinkhole = sink(next);
    return async (t: Target): Promise<void> => {
      if(t instanceof constructor) {
        return await sinkhole(t as T);
      }
    };
  };
}

export const TargetUrlFilter = (pattern: RegExp) => (sink: Sink<Target>): Sink<Target> => {
  return (next: NextFn): (t: Target) => Promise<void> => {
    const sinkhole = sink(next);
    return async (t: Target): Promise<void> => {
      if(pattern.test(t.url)) return await sinkhole(t);
    };
  };
};
