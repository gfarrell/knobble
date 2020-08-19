export interface Target {
  url: string;
}

export interface FileDownloadTarget extends Target {
  storageDirectory: string;
  filename: string;
}

export enum DatafileFormat {
  json,
  csv,
}

export interface DatafileTarget extends Target {
  format: DatafileFormat;
  outputfile: string;
  append: boolean;
}
