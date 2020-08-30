import csvStringify from "csv-stringify";
import { stringify as jsonStringify } from "ndjson";
import { Readable, pipeline } from "stream";
import unary from "lodash/unary";
import pick from "lodash/fp/pick";
import identity from "lodash/fp/identity";
import { Downloader } from "../helpers/downloader";
import { DatafileTarget, DatafileFormat } from "../targets";
import path from "path";
import { createWriteStream } from "fs";
import { elementExtractor } from "../helpers/element_extractor";
import { Sink } from "./";

type RecordType = Record<string, unknown>;
type Parser<T extends RecordType> = (dom: HTMLElement) => T;

type Serialiser<T extends RecordType> = (t: T[]) => Readable;

const recordToColumns = <T extends RecordType>(cols: (keyof T)[]) => (record: T): T[keyof T][] => {
  return cols.map((col) => record[col]);
};

const CsvSerialiser = <T extends RecordType>(cols: (keyof T)[]): Serialiser<T> => {
  const columniser = recordToColumns(cols);
  return (t: T[]) => csvStringify(t.map(unary(columniser)));
};

const JsonSerialiser = <T extends RecordType>(fields?: (keyof T)[]): Serialiser<T> => {
  const stream = jsonStringify();
  return (t: T[]) => {
    const select = fields ? pick(fields) : identity;
    t.map(unary(select)).map(unary(stream.write.bind(stream)));
    stream.end();
    return stream;
  };
}

export const datafileWriterFactory = (download: Downloader) => <T extends RecordType>(selector: string, parser: Parser<T>, fields?: (keyof T)[]): Sink<DatafileTarget> => {
  const getElements = elementExtractor(parser)(selector)(download);
  return () => async (target: DatafileTarget): Promise<void> => {
    const data: T[] = await getElements(target.url);
    const resolvedPath = path.resolve(target.outputFile);
    let dataStreamCreator: Serialiser<T>;
    switch(target.format) {
      case DatafileFormat.csv:
        if(!fields) throw new TypeError("Need fields to be defined for CSV output");
        dataStreamCreator = CsvSerialiser(fields);
        break;
      case DatafileFormat.json:
        dataStreamCreator = JsonSerialiser(fields);
        break;
      default:
        throw new TypeError(`Unknown file format ${target.format}`);
    }
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(resolvedPath, {
        flags: target.append ? "a" : "w"
      }).on("error", (err) => reject(err));
      pipeline(dataStreamCreator(data), writeStream, (err) => {
        if(err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
};
