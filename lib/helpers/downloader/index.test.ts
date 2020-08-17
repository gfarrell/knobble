import { createDownloadPool, DownloadPool, PoolClosedError } from "./";
import nock from "nock";
import { times } from "lodash";

const wait = async (t = 10) => new Promise((r) => setTimeout(r, t));

describe("Download pool factory creates a DownloadPool", () => {
  const limit = 3;
  let pool: DownloadPool;

  beforeEach(() => pool = createDownloadPool(limit, 10));
  afterEach(() => pool?.close());
  afterEach(() => nock.cleanAll());

  it("which allows a given number of simultaneous downloads", async () => {
    const URL = "http://te.st";
    const paths = times(limit * 2, (i) => `/${i}.html`);
    const makeInterceptor = (path: string): nock.Scope => {
      return nock(URL).get(path).delayConnection(250).reply(200, `Hello ${path}`);
    };
    const testArray = (iter: (i?: number) => boolean) => times(limit * 2, iter);
    const mocks = paths.map(makeInterceptor);
    const getDone = () => mocks.map((mock) => mock.isDone());
    const finished: boolean[] = testArray(() => false);
    paths.map((path) => pool.download(URL + path))
         .forEach((dl, i) => dl.then(() => finished[i] = true));
    expect(getDone()).toEqual(testArray(() => false));
    expect(finished).toEqual(testArray(() => false));
    await wait(300);
    expect(getDone()).toEqual(testArray(() => true));
    expect(finished).toEqual(testArray((i) => i < limit));
    await wait(250);
    expect(getDone()).toEqual(testArray(() => true));
    expect(finished).toEqual(testArray(() => true));
  });

  it("which passes the response objects back to the requester", async () => {
    const mock = nock("http://te.st").get("/hello.html").reply(200, "Hello World").persist();
    const responses: string[] = await Promise.all(
      times(limit * 2, () => pool.download("http://te.st/hello.html").then((r) => r.text()))
    );
    mock.done();
    expect(responses.some((r) => r !== "Hello World")).toBe(false);
  });

  it("which passes errors back to the requester", async () => {
    nock("http://te.st").get("/unhappy.html").reply(403, "You aren't allowed to be unhappy");
    const response = await pool.download("http://te.st/unhappy.html");
    expect(response.ok).toBe(false);
    expect(await response.text()).toEqual("You aren't allowed to be unhappy");
  });

  it("which rejects queued downloads when the pool is closed", () => {
    pool.close();
    expect(() => pool.download("http://te.st/too_late.html"))
      .toThrowError(new PoolClosedError());
  });

  it("which cancels in-flight downloads when the pool is closed", async () => {
    const URL = "http://te.st";
    const paths = times(limit * 2, (i) => `/${i}.html`);
    const makeInterceptor = (path: string): nock.Scope => {
      return nock(URL).get(path).delayConnection(100).reply(200, `Hello ${path}`);
    };
    const mocks = paths.map(makeInterceptor);
    expect(mocks.map((m) => m.isDone())).toEqual(times(limit * 2, () => false));
    const responses = Promise.all(paths.map(
      (path) => pool.download(URL + path)
                .then(() => "Got a response...")
                .catch((err: PoolClosedError) => err.message)
    ));
    await wait(50);
    pool.close();
    await wait (50);
    expect(mocks.map((m) => m.isDone())).toEqual(
      times(limit * 2, (i) => i < limit)
    );
    expect(await responses).toEqual(paths.map((p) => (new PoolClosedError(URL + p)).message));
    nock.abortPendingRequests();
  });
});
