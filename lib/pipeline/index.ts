import { Subject, Observable } from "rxjs";

export interface Target {
  url: string;
}

type NextFn = (t: Target) => void;
type StopFn = () => void;

export interface Source {
  (next: NextFn): StopFn
}

export interface Sink {
  (next: NextFn): (t: Target) => Promise<void>
}

interface Pipeline {
  start: () => Observable<Target>;
  stop: () => void;
}

export function connect(sources: Source[], sinks: Sink[]): Pipeline {
  const ourobos = new Subject<Target>();
  const nextFn: NextFn = ourobos.next.bind(ourobos);

  let initialised = false;
  let stopFns: StopFn[];

  sinks.forEach((sink) => ourobos.subscribe(sink(nextFn)));

  return {
    start(): Observable<Target> {
      if(initialised) return ourobos;
      stopFns = sources.map((source) => source(nextFn));
      initialised = true;
      return ourobos;
    },

    stop(): void {
      if(!initialised) throw new Error("cannot stop an uninitialied pipeline");
      stopFns.forEach((f) => f());
      initialised = false;
    }
  };
}
