import { fake } from "sinon";
import { Target } from "../targets";
import { TargetUrlFilter, TargetTypeFilter } from "./filter";

describe("TargetTypeFilter", () => {
  it("only passes targets of a given type to the underlying sink", async () => {
    const sink = fake.resolves(void 0);
    class MagicTarget implements Target {
      url: string;
      type: "magic";

      constructor(url: string) {
        this.type = "magic";
        this.url = url;
      }
    }
    const filtered = TargetTypeFilter(MagicTarget)(() => sink)(() => void 0);
    await filtered(new MagicTarget("http://te.st/hello.html"));
    await filtered({ url: "http://te.st/goodbye.html" });
    expect(sink.callCount).toEqual(1);
    expect(sink.firstCall.args).toEqual([new MagicTarget("http://te.st/hello.html")]);
  });
});

describe("TargetUrlFilter", () => {
  it("only passes targets whose URLs match the pattern to the underlying sink", async () => {
    const sink = fake.resolves(void 0);
    const pattern = /te\.st\/cool_(\w+)\.html/;
    const targets = [
      "http://te.st/uncool_five.html",
      "http://hello.com/about.html",
      "https://te.st/cool_things.html",
      "http://te.st/cool_runnings.html",
    ].map((url) => ({ url }));
    const filtered = TargetUrlFilter(pattern)(() => sink)(() => void 0);
    await Promise.all(targets.map(filtered));
    expect(sink.callCount).toEqual(2);
    expect(sink.firstCall.args).toEqual([{ url: "https://te.st/cool_things.html" }]);
    expect(sink.secondCall.args).toEqual([{ url: "http://te.st/cool_runnings.html" }]);
  });
});
