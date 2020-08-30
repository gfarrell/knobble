import { Target, FileDownloadTarget } from "../targets";
import { Sink } from "./";
import { Downloader, DownloadError } from "../helpers/downloader";
import path from "path";
import { stat, access } from "fs/promises";
import { constants, createWriteStream } from "fs";
import { pipeline } from "stream";
import { TargetTypeFilter } from "./filter";
import { NoDirectoryAccessError } from "../common";

export const rawFileDownloaderFactory = (download: Downloader): Sink<FileDownloadTarget> => {
  return () => async (target: FileDownloadTarget): Promise<void> => {
    const dir = target.storageDirectory;
    const resolvedDir = path.resolve(dir);
    try {
      const dirStats = await stat(resolvedDir);
      await access(resolvedDir, constants.W_OK);
      if(!dirStats.isDirectory()) throw new Error();
    } catch(err) {
      throw new NoDirectoryAccessError(resolvedDir);
    }
    const response = await download(target.url);
    if(response.ok) {
      await new Promise((resolve, reject) => {
        pipeline(
          response.body,
          createWriteStream(path.resolve(resolvedDir, target.filename)),
          (err) => {
            if(err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    } else {
      throw new DownloadError(target.url, response.status);
    }
  };
};

export const fileDownloaderFactory = (download: Downloader): Sink<Target> => {
  return TargetTypeFilter(FileDownloadTarget)(fileDownloaderFactory(download));
};
