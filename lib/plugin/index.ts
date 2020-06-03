import { Observable, defer, of } from "rxjs";
import { filter, flatMap } from "rxjs/operators";
import { Target } from "../target";

/**
 * A filter is either a string or regular expression which will be used to match
 * Target types.
 */
export type Filter = string|RegExp;

/**
 * Generates a filter function for an the `filter` operator.
 */
const filterFactory = (filter: Filter) => (target: Target): boolean => {
  if(typeof filter === "string") {
    return (filter as string) === target.targetType;
  } else if(filter instanceof RegExp) {
    return (filter as RegExp).test(target.targetType);
  } else {
    throw new TypeError("Invalid filter " + String(filter));
  }
};

/**
 * Simple identity receiver, gives back what it gets.
 */
const identity: Receiver = (target: Target) => target;

/**
 * Simple not null filter, returns true iff the target is not null, otherwise
 * false.
 */
const notNull = (target: Target | null): boolean => target !== null;

/**
 * A Receiver will receive a target from a stream, and either transform that
 * target or return null if that target is to be discarded. A simple example
 * would be the dedupe Receiver, which returns a Target the first time it sees
 * it, but returns null on every subsequent occurrence.
 */
export type Receiver = (target: Target) => Promise<Target|null> | Target | null;

/**
 * A Sender is a function we call when we are done processing a Target. It takes
 * a URL and a target type (therefore implicitly creating a new Target for a
 * different plugin to process).
 */
export type Sender = (url: string, targetType: string) => void;

/**
 * A Plugin specifies a filter which can be a string or regular expression to
 * match a Target type. It will then fire its Receiver function for each
 * incoming target. Optionally, you can specify middleware, which is an array of
 * Receivers which will process the Target before it hits the final Receiver
 * function.
 */
export interface Plugin {
  filter: Filter;
  middleware?: Receiver[];
  getReceiver: (send: Sender) => Receiver;
}

/**
 * Registers a plugin to listen to a given observable stream input, sending the
 * results using the supplied send function.
 */
export function registerPlugin(plugin: Plugin, stream: Observable<Target>, send: Sender): void {
  const middlewarez = (plugin.middleware ?? [identity]).map((receiver) => {
    return flatMap((target: Target) => {
      const result = receiver(target);
      return result instanceof Promise ? defer(() => result) : of(result);
    })
  });

  // super ugly workaround to https://github.com/ReactiveX/rxjs/issues/3989
  middlewarez.reduce((obs: Observable<Target>, operator) => obs.pipe(operator),
                     stream.pipe(filter(filterFactory(plugin.filter))))
             .pipe(filter(notNull))
             .subscribe(plugin.getReceiver(send));
}
