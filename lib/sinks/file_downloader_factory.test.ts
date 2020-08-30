import { rawFileDownloaderFactory } from "./file_downloader_factory";
import { NoDirectoryAccessError } from "../common";
import { FileDownloadTarget } from "../targets";
import { DownloadError } from "../helpers/downloader";
import os from "os";
import fs from "fs/promises";
import path from "path";
import nock from "nock";
import fetch from "node-fetch";

const noop = () => void 0;

describe("fileDownloaderFactory() creates a sink which", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "knobble-test-"));
  });

  afterEach(async () => {
    await fs.rmdir(dir, { recursive: true });
    dir = null;
  });

  it("saves the body of a request to a given file", async () => {
    const content = "the quick brown fox jumps over the lazy dog";
    nock("http://te.st").get("/file.txt").reply(200, content);
    const file = path.join(dir, "file.txt");
    const t = new FileDownloadTarget("http://te.st/file.txt", "file.txt", dir);
    await rawFileDownloaderFactory(fetch)(noop)(t);
    expect((await fs.stat(file)).isFile()).toBe(true);
    expect((await fs.readFile(file)).toString()).toEqual(content);
  });

  it("throws a NoDirectoryAccessError if the directory doesn't exist or is not writable", async () => {
    const badDir = dir + `-${Math.floor(Math.random() * 1000)}`;
    const t = new FileDownloadTarget("http://te.st/file.txt", "file.txt", badDir);
    const fun = rawFileDownloaderFactory(fetch)(noop);
    await expect(() => fun(t)).rejects.toThrow(new NoDirectoryAccessError(badDir));
  });

  it("throws a DownloadError if the download fails", async () => {
    nock("http://te.st").get("/file.txt").reply(404);
    const t = new FileDownloadTarget("http://te.st/file.txt", "file.txt", dir);
    const fun = rawFileDownloaderFactory(fetch)(noop);
    await expect(() => fun(t)).rejects.toThrow(new DownloadError("http://te.st/file.txt", 404));
  });
});
