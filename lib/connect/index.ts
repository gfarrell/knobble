import { Observable, Subject, merge } from "rxjs";
import { distinct } from "rxjs/operators";
import { Source } from "../source";
import { registerPlugin, Plugin, Sender } from "../plugin";
import { makeTarget, Target } from "../target";

/**
 * Connects an array of sources and an array of plugins, returning the resulting
 * Observable.
 */
export default function connect(sources: Source[], plugins: Plugin[]): Observable<Target> {
  const ourobos = new Subject<Target>();
  const send: Sender = (url, targetType): void => ourobos.next(makeTarget(targetType)(url));

  const source: Observable<Target> = merge(...sources.map((source) => source.init()), ourobos)
  .pipe(distinct((t) => t.targetType + "|" + t.url));
  plugins.forEach((plugin) => {
    registerPlugin(plugin, source, send);
  });
  return source;
}
