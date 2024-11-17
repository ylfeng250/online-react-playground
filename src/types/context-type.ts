import { IFiles } from "./file-type";

export interface IPlaygroundContext {
  files: IFiles;
  setFiles: (files: IFiles) => void;
  entryFile: string;
  setEntryFile: (entryFile: string) => void;
}
