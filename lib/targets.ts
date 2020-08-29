export interface Target {
  url: string;
}

export class FileDownloadTarget implements Target {
  storageDirectory: string;
  filename: string;
  url: string;

  constructor(url: string, filename: string, storageDirectory: string) {
    this.url = url;
    this.filename = filename;
    this.storageDirectory = storageDirectory;
  }
}

export enum DatafileFormat {
  json,
  csv,
}

export class DatafileTarget implements Target {
  format: DatafileFormat;
  outputFile: string;
  append: boolean;
  url: string;

  constructor(url: string, format: DatafileFormat, outputFile: string, append: boolean) {
    this.url = url;
    this.format = format;
    this.outputFile = outputFile;
    this.append = append;
  }
}
