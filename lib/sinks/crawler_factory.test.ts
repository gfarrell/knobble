import { crawlerFactory } from "./crawler_factory";
import { Response } from "node-fetch";
import { Target } from "../targets";
import { spy } from "sinon";

describe("crawlerFactory", () => {
  it("creates a Sink which uses the specified selector, map, and downloader to push new Targets", async () => {
    const download = async (url: string): Promise<Response> => {
      expect(url).toEqual("http://te.st/start.html");
      let html = "<!DOCTYPE html><html><head></head><body>";
          html += "<div class=\"links-container\">";
          html += "<a href=\"http://te.st/one.html\">One</a>";
          html += "<a href=\"http://te.st/two.html\">Two</a>";
          html += "<a href=\"http://te.st/three.html\">Three</a>";
          html += "</div>";
          html += "<a href=\"http://te.st/about.html\">About this</a>";
          html += "</body></html>";

      return new Response(html, { status: 200 });
    };
    interface MagicTarget extends Target {
      type: string;
    }
    const selector = ".links-container > a";
    const mapper = (url: string): MagicTarget => {
      return { url, type: "magic" };
    };
    const sink = crawlerFactory(selector)(mapper)(download);
    const nextFn = spy();
    await sink(nextFn)({ url: "http://te.st/start.html" });
    await new Promise((r) => setTimeout(r, 10));
    expect(nextFn.callCount).toEqual(3);
    expect(nextFn.firstCall.args)
      .toEqual([{ url: "http://te.st/one.html", type: "magic" }]);
    expect(nextFn.secondCall.args)
      .toEqual([{ url: "http://te.st/two.html", type: "magic" }]);
    expect(nextFn.thirdCall.args)
      .toEqual([{ url: "http://te.st/three.html", type: "magic" }]);
  });
});
