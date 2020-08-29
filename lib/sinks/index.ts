import { Target } from "../targets";
import { NextFn } from "../common";
export interface Sink<T extends Target> {
  (next: NextFn): (t: T) => Promise<void>
}

export type TargetFactory = (url: string) => Target;
