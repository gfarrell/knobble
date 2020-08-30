// This example fetches the latest commit from a list of repositories and stores
// the repository name and the latest commit time in a CSV file.

import { connect, Source } from "../../lib/pipeline";
import { NextFn } from "../../lib/common";
import { datafileWriterFactory } from "../../lib/sinks/datafile_writer_factory";
import { DatafileTarget, DatafileFormat } from "../../lib/targets";
import { createDownloadPool } from "../../lib/helpers/downloader";

const noop = () => void 0;

interface RepoInfo extends Record<string, string>{
  repo: string;
  latestCommitText: string;
  latestCommitUser: string;
  latestCommitTime: string;
}

const repos = 
  [ "gfarrell/knobble"
  , "jsdom/jsdom"
  , "ReactiveX/rxjs"
  , "adaltas/node-csv-stringify"
  , "ndjson/ndjson.js"
  ];

const repoSource: Source = (next: NextFn) => {
  repos.map((repo) => {
    const url = `https://github.com/${repo}/commits/master`;
    return new DatafileTarget(url, DatafileFormat.csv, "./repos.csv", true);
  }).map(next);

  return noop; // stop doesn't mean anything in this case
};

const selector = ".repository-content";

// a parser to extract the data we want
const extractLatestCommitInfo = (el: HTMLElement): RepoInfo => {
  const firstItem = el.querySelector(".TimelineItem-body .Details");
  return {
    repo: firstItem.querySelector(".commit-author").getAttribute("href").split("/").slice(1, 3).join("/"),
    latestCommitText: firstItem.querySelector("a").innerHTML,
    latestCommitUser: firstItem.querySelector(".commit-author").innerHTML,
    latestCommitTime: firstItem.querySelector("relative-time").getAttribute("datetime")
  };
};

const downloadPool = createDownloadPool(5);

const dataSink = datafileWriterFactory(downloadPool.download)(selector, extractLatestCommitInfo, ["repo", "latestCommitUser", "latestCommitText", "latestCommitTime"]);

const pipeline = connect([repoSource], [dataSink]);

let count = 0;
pipeline.start().subscribe((target) => {
  console.log("Processing", target.url);
  if(count++ >= repos.length - 1) {
    downloadPool.close();
    pipeline.stop();
  }
});
