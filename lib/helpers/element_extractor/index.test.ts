import { elementExtractor } from "./";
import { DownloadError } from "../downloader";
import { Response } from "node-fetch";
import { fake } from "sinon";

describe("elementExtractor creates a factory function which", () => {
  it("uses the supplied download function to download a URL", async () => {
    const body = "<!DOCTYPE html><html><head></head><body></body></html>";
    const dl = fake.returns(new Response(body, {
      status: 200,
      statusText: "OK",
    }));
    await elementExtractor(() => 1)("a")(dl)("https://te.st/");
    expect(dl.callCount).toEqual(1);
    expect(dl.firstCall.args).toEqual(["https://te.st/"]);
  });

  it("throws a DownloadError if the response isn't ok", async () => {
    const dl = async () => {
      const r = new Response(null, {
        status: 404,
        statusText: "Not Found",
      });
      return r;
    };

    await expect(() => elementExtractor(() => 1)("")(dl)("https://te.st/"))
    .rejects.toThrowError(new DownloadError("https://te.st/", 404));
  });

  it("applies a mapFn to selected elements", async () => {
    let body = "<!DOCTYPE html><html><head><title>Test Page</title></head><body>";
        body += "<ul class=\"testing\">";
        body += "<li data-id=1>One</li>";
        body += "<li data-id=2>Two</li>";
        body += "<li data-id=3>Three</li>";
        body += "</ul>";
        body += "<ul class=\"not-testing\">";
        body += "<li data-id=4>Four</li>";
        body += "</ul>";
        body += "</body></html>";
    const dl = async () => new Response(body, { status: 200, statusText: "OK" });
    const extract = (el: HTMLElement): number => Number(el.getAttribute("data-id"));
    const res = await elementExtractor(extract)(".testing li")(dl)("https://te.st/start.html");
    expect(res).toHaveLength(3);
    expect(res).toEqual([ 1, 2, 3 ]);
  });
});
