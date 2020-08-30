import { Target } from "./targets";

export type NextFn = (t: Target) => void;
export type StopFn = () => void;

export class NoDirectoryAccessError extends Error {
  path: string;

  constructor(path: string) {
    super(`Unable to access ${path} -- either it does not exist or is not writable.`);
    Object.setPrototypeOf(this, NoDirectoryAccessError.prototype);
    this.path = path;
  }
}
