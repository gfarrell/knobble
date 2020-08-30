import { Sink } from "./";
import { Target } from "../targets";
import { RetrySink, MaxRetriesExceededError } from "./retry";
import { spy, fake } from "sinon";

const wait = async (t = 10) => new Promise((r) => setTimeout(r, t));

describe("RetrySink", () => {
  it("allows a Sink to fail against a given target up to a given number of times", async () => {
    const next = spy();
    const fun = fake.rejects(new Error("always fails"));
    const t: Target = { url: "http://te.st/fail.html" };
    const s: Sink<Target> = () => fun;
    const sink = RetrySink(2)(s);
    await sink(next)(t);
    await wait(5);
    expect(fun.calledOnce).toBe(true);
    expect(next.calledOnce).toBe(true);
    expect(next.firstCall.args).toEqual([t]);
    await sink(next)(t);
    await wait(5);
    expect(fun.calledTwice).toBe(true);
    expect(next.calledTwice).toBe(true);
    expect(next.secondCall.args).toEqual([t]);
    await expect(() => sink(next)(t)).rejects.toThrow(
      new MaxRetriesExceededError(t.url, new Error("always fails"))
    );
    expect(next.calledTwice).toBe(true);
  });

  it("resets the counter after a successful execution", async () => {
    let shouldFail = true;
    const next = spy();
    const fun = async () => {
      if(shouldFail) throw new Error("failed");
    };
    const t: Target = { url: "http://te.st/maybefail.html" };
    const sink = RetrySink(2)(() => fun);
    await sink(next)(t);
    await wait(5);
    expect(next.calledOnce).toBe(true);
    shouldFail = false;
    await sink(next)(t);
    await wait(5);
    expect(next.calledOnce).toBe(true);
    shouldFail = true;
    await sink(next)(t);
    await wait(5);
    expect(next.calledTwice).toBe(true);
    await sink(next)(t);
    await wait(5);
    expect(next.calledThrice).toBe(true);
    await expect(() => sink(next)(t)).rejects.toThrow(
      new MaxRetriesExceededError(t.url, new Error("failed"))
    );
    expect(next.calledThrice).toBe(true);
  });
});
