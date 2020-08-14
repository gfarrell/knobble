import { spy } from "sinon";
import { times } from "lodash";
import { connect, Source, Sink, Target } from "./";

/* eslint-disable-next-line @typescript-eslint/no-empty-function */
const noop = () => {};
const awaitPredicate = async (predicate: () => boolean, timeoutMS = 500, intervalMS = 10) => {
  if(intervalMS >= timeoutMS) throw new Error("you probably didn't mean to set the interval bigger than the timeout");
  return new Promise((resolve, reject) => {
    if(predicate()) return resolve();
    const timeoutTimer = setTimeout(() => {
      clearInterval(intervalTimer);
      reject("Timed out waiting for predicate");
    }, timeoutMS);
    const intervalTimer = setInterval(() => {
      if(predicate()) {
        clearTimeout(timeoutTimer);
        clearInterval(intervalTimer);
        resolve();
      }
    }, intervalMS);
  });
};
const getUrl = (t: Target) => t.url;
const comparableList = (tt: Target[]): string[] => tt.map(getUrl).sort();

describe("Pipeline#connect creates a pipeline object", () => {
  describe("whose start() method", () => {
    it("causes sources to generate events passed to sinks", async () => {
      const events = times(10).map((i: number) => ({ url: `https://te.st/${i}.html` }));
      const received = [];
      const mySource: Source = (next) => {
        events.map((t) => next(t));
        return noop;
      };
      const mySink: Sink = () => async (t) => {
        received.push(t);
      };
      connect([mySource], [mySink]).start();

      await awaitPredicate(() => received.length === events.length);

      expect(comparableList(received)).toEqual(comparableList(events));
    });

    it("can be called twice with no failures, and no double-processing", async () => {
      const allEvents: Target[] = times(10).map((i) => ({ url: `https://te.st/${i}.html` }));
      const batch1 = allEvents.slice(0, 5);
      const batch2 = allEvents.slice(5);
      const received = [];
      let trigger: () => void;
      const mySource: Source = (next) => {
        trigger = () => batch2.map(next);
        batch1.map((t) => next(t));
        return noop;
      };
      const mySink: Sink = () => async (t) => {
        received.push(t);
      };
      const pipeline = connect([mySource], [mySink]);
      pipeline.start();
      pipeline.start();
      trigger();

      await awaitPredicate(() => received.length >= allEvents.length);

      expect(received.length).toEqual(allEvents.length);
      expect(comparableList(received)).toEqual(comparableList(allEvents));
    });

    it("returns the event stream containing the Targets generated", async () => {
      const events: Target[] = times(10).map((i) => ({ url: `https://te.st/${i}.html` }));
      const receivedSink: Target[] = [];
      const receivedPipe: Target[] = [];
      let trigger: () => void;
      const mySource: Source = (next) => {
        trigger = () => events.forEach((t) => next(t));
        return noop;
      };
      const mySink: Sink = () => async (t) => {
        receivedSink.push(t);
      };
      const pipeline = connect([mySource], [mySink]);
      const stream = pipeline.start();
      stream.subscribe((t) => {
        receivedPipe.push(t);
      });
      trigger();

      await awaitPredicate(() => {
        return receivedPipe.length == receivedSink.length
            && receivedSink.length == events.length;
      });

      expect(comparableList(receivedSink)).toEqual(comparableList(receivedPipe));
      expect(comparableList(receivedSink)).toEqual(comparableList(events));
    });
  });

  describe("whose stop() method", () => {
    it("causes sources to have their stop function called", () => {
      const stopFn = spy();
      const mySource: Source = () => {
        return stopFn;
      };
      const pipeline = connect([mySource], []);
      pipeline.start();
      expect(stopFn.called).toBe(false);
      pipeline.stop();
      expect(stopFn.callCount).toEqual(1);
    });

    it("cannot be called before start()", () => {
      const mySource: Source = () => {
        return noop;
      };
      const pipeline = connect([mySource], []);
      expect(() => pipeline.stop()).toThrow();
    });
  });
});
