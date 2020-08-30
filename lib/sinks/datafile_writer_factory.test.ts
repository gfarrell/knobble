import { datafileWriterFactory } from "./datafile_writer_factory";
import { DownloadError } from "../helpers/downloader";
import { DatafileTarget, DatafileFormat } from "../targets";
import fs from "fs/promises";
import { createReadStream } from "fs";
import os from "os";
import path from "path";
import fetch from "node-fetch";
import nock from "nock";
import ndjson from "ndjson";

const HTMLDATA = `<!DOCTYPE html>
<html>
  <head><title>Address Book</title></head>
  <body>
    <h1>Your Contacts</h1>
    <section id="contacts">
      <h2>A</h2>
      <div class="card">
        <h3>Alice</h3>
        <p class="email">alice@wonderland.net</p>
      </div>
      <h2>C</h2>
      <div class="card">
        <h3>Cheshire Cat</h3>
        <p>Skills: <span class="skills">Disappearing, smiling</span></p>
        <p class="email">smiles@wonderland.net</p>
      <h2>M</h2>
      <div class="card">
        <h3>Mad Hatter</h3>
        <p>Favourite drink: tea</p>
        <p class="email">lafolie@wonderland.net</p>
      </div>
      <h2>R</h2>
      <div class="card">
        <h3>Red Queen</h3>
        <p>Action of choice: <span class="skills">Beheading</span></p>
        <p class="email">offwithyourhead@wonderland.net</p>
      </div>
    </section>
  </body>
</html>`;

const HTMLDATA2 = `<!DOCTYPE html>
<html>
  <head>
    <title>Moar Addresses</title>
  </head>
  <body>
    <h1>Your Contacts</h1>
    <section id="contacts">
      <h2>D</h2>
      <div class="card">
        <h3>Deepthought</h3>
        <p>Contact via: <span class="email">askmeanything@42.net</span></p>
        <p>Good at: <span class="skills">answering questions, staying still</span></p>
      </div>
    </section>
  </body>
</html>`;

const noop = () => void 0;

const readJSON = async <T>(file: string): Promise<T[]> => new Promise((resolve, reject) => {
  const data: T[] = [];
  createReadStream(file)
  .pipe(ndjson.parse())
  .on("data", (obj) => data.push(obj as T))
  .on("end", () => resolve(data))
  .on("error", reject);
});

describe("datafileWriterFactory creates a Sink which", () => {
    let dir: string;
    const selector = "div.card";
    interface Contact extends Record<string, string|string[]> {
      name: string;
      email: string;
      skills?: string[];
    }
    const parser = (dom: HTMLElement): Contact => {
      const card: Contact = {
        name: dom.querySelector("h3").innerHTML,
        email: dom.querySelector(".email").innerHTML,
      };
      const skills = dom.querySelector(".skills")?.innerHTML
                        .split(",").map((v) => v.trim().toLowerCase());
      if(skills) card.skills = skills;
      return card;
    };

    beforeEach(async () => {
      dir = await fs.mkdtemp(path.join(os.tmpdir(), "knobble-test-"));
    });

    afterEach(async () => {
      await fs.rmdir(dir, { recursive: true });
      dir = null;
    });

  describe("uses the given selector and parser to", () => {
    it("transform elements into NDJSON data", async () => {
      const file = path.join(dir, "addresses.json");
      nock("http://te.st").get("/addressbook.html").reply(200, HTMLDATA);
      const t = new DatafileTarget(
        "http://te.st/addressbook.html",
        DatafileFormat.json,
        file,
        true
      );

      const sink = datafileWriterFactory(fetch)(selector, parser);
      await sink(noop)(t);
      const readData: Contact[] = await readJSON(file);
      expect(readData).toEqual([
        { name: "Alice", email: "alice@wonderland.net" },
        { name: "Cheshire Cat", email: "smiles@wonderland.net", skills: ["disappearing", "smiling"] },
        { name: "Mad Hatter", email: "lafolie@wonderland.net" },
        { name: "Red Queen", email: "offwithyourhead@wonderland.net", skills: ["beheading"] },
      ]);
    });

    it("transform elements into CSV data", async () => {
      const file = path.join(dir, "addresses.csv");
      nock("http://te.st").get("/addressbook.html").reply(200, HTMLDATA);
      const t = new DatafileTarget(
        "http://te.st/addressbook.html",
        DatafileFormat.csv,
        file,
        true
      );
      const fields = ["name", "email"];
      const sink = datafileWriterFactory(fetch)(selector, parser, fields);
      await sink(noop)(t);
      const readData = await fs.readFile(file);
      expect(readData.toString()).toEqual(
`Alice,alice@wonderland.net
Cheshire Cat,smiles@wonderland.net
Mad Hatter,lafolie@wonderland.net
Red Queen,offwithyourhead@wonderland.net
`
      );
    });
  });

  it("selects only the given fields for the data", async () => {
    const file = path.join(dir, "addresses.csv");
    nock("http://te.st").get("/addressbook.html").reply(200, HTMLDATA);
    const t = new DatafileTarget(
      "http://te.st/addressbook.html",
      DatafileFormat.csv,
      file,
      true
    );
    const fields = ["name"];
    const sink = datafileWriterFactory(fetch)(selector, parser, fields);
    await sink(noop)(t);
    const readData = await fs.readFile(file);
    expect(readData.toString()).toEqual(
`Alice
Cheshire Cat
Mad Hatter
Red Queen
`
    );
  });

  it("cleans out the file if append is set to false", async () => {
    const file = path.join(dir, "addresses.json");
    nock("http://te.st").get("/addresses1.html").reply(200, HTMLDATA);
    nock("http://te.st").get("/addresses2.html").reply(200, HTMLDATA2);

    const t1 = new DatafileTarget(
      "http://te.st/addresses1.html",
      DatafileFormat.json,
      file,
      false
    );
    const t2 = new DatafileTarget(
      "http://te.st/addresses2.html",
      DatafileFormat.json,
      file,
      false
    );

    const sink = datafileWriterFactory(fetch)(selector, parser);

    await sink(noop)(t1);
    const readData1 = await readJSON(file);
    expect(readData1).toEqual([
      { name: "Alice", email: "alice@wonderland.net" },
      { name: "Cheshire Cat", email: "smiles@wonderland.net", skills: ["disappearing", "smiling"] },
      { name: "Mad Hatter", email: "lafolie@wonderland.net" },
      { name: "Red Queen", email: "offwithyourhead@wonderland.net", skills: ["beheading"] },
    ]);

    await sink(noop)(t2);
    const readData2 = await readJSON(file);
    expect(readData2).toEqual([{
      name: "Deepthought",
      email: "askmeanything@42.net",
      skills: ["answering questions", "staying still" ]
    }]);
  });

  it("appends data from additional targets if append is set to true", async () => {
    const file = path.join(dir, "addresses.json");
    nock("http://te.st").get("/addresses1.html").reply(200, HTMLDATA);
    nock("http://te.st").get("/addresses2.html").reply(200, HTMLDATA2);

    const t1 = new DatafileTarget(
      "http://te.st/addresses1.html",
      DatafileFormat.json,
      file,
      true
    );
    const t2 = new DatafileTarget(
      "http://te.st/addresses2.html",
      DatafileFormat.json,
      file,
      true
    );

    const sink = datafileWriterFactory(fetch)(selector, parser);
    const set1 = [
      { name: "Alice", email: "alice@wonderland.net" },
      { name: "Cheshire Cat", email: "smiles@wonderland.net", skills: ["disappearing", "smiling"] },
      { name: "Mad Hatter", email: "lafolie@wonderland.net" },
      { name: "Red Queen", email: "offwithyourhead@wonderland.net", skills: ["beheading"] },
    ];
    const set2 = [{
      name: "Deepthought",
      email: "askmeanything@42.net",
      skills: ["answering questions", "staying still" ]
    }];

    await sink(noop)(t1);
    const readData1 = await readJSON(file);
    expect(readData1).toEqual(set1);

    await sink(noop)(t2);
    const readData2 = await readJSON(file);
    expect(readData2).toEqual(set1.concat(set2));
  });

  it("throws when it cannot write to the file", async () => {
    const newFile = path.join(dir + "-not", "addresses.json");
    nock("http://te.st").get("/addressbook.html").reply(200, HTMLDATA);
    const t = new DatafileTarget(
      "http://te.st/addressbook.html",
      DatafileFormat.json,
      newFile,
      true
    );
    const fun = datafileWriterFactory(fetch)(selector, parser)(noop);
    await expect(() => fun(t)).rejects.toThrow();
  });

  it("throws when it cannot read from the external source", async () => {
    const file = path.join(dir, "addresses.json");
    nock("http://te.st").get("/addressbook.html").reply(404);
    const t = new DatafileTarget(
      "http://te.st/addressbook.html",
      DatafileFormat.json,
      file,
      true
    );
    const fun = datafileWriterFactory(fetch)(selector, parser)(noop);
    await expect(() => fun(t)).rejects.toThrow(new DownloadError("http://te.st/addressbook.html", 404));
  });
});
