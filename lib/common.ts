import { Target } from "./targets";

export type NextFn = (t: Target) => void;
export type StopFn = () => void;
