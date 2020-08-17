import { linkExtractor, DownloadError } from "./";
import { Response } from "node-fetch";
import { fake } from "sinon";

describe("linkExtractor", () => {
  it("uses the supplied download function to download a URL", async () => {
    const body = "<!DOCTYPE html><html><head></head><body></body></html>";
    const dl = fake.returns(new Response(body, {
      status: 200,
      statusText: "OK",
    }));
    await linkExtractor(dl)("a")("https://te.st/");
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

    await expect(() => linkExtractor(dl)("")("https://te.st/"))
    .rejects.toThrowError(new DownloadError("https://te.st/", 404));
  });

  it("returns an array of the extracted URLs given a link selector", async () => {
    let body = "<!DOCTYPE html><html><head><title>Test Page</title></head><body>";
        body += "<div class=\"testing\">";
        body += "<a href=\"https://www.te.st/one.html\" title=\"One\">One</a>";
        body += "<a href=\"https://www.te.st/two.html\" title=\"Two\">Two</a>";
        body += "<a href=\"https://www.te.st/three.html\" title=\"Three\">Three</a>";
        body += "</div>";
        body += "<a href=\"https://www.te.st/four.html\" title=\"Four\">Four</a>";
        body += "</body></html>";
    const dl = async () => new Response(body, { status: 200, statusText: "OK" });
    const res = await linkExtractor(dl)(".testing a")("https://te.st/start.html");
    expect(res).toHaveLength(3);
    expect(res).toEqual([
        "https://www.te.st/one.html",
        "https://www.te.st/two.html",
        "https://www.te.st/three.html",
    ]);
  });
});
