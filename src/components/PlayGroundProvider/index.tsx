import { useState, createContext, ReactNode } from "react";
import { IPlaygroundContext } from "../../types/context-type";
import { IFiles } from "../../types/file-type";

const PlaygroundContext = createContext<IPlaygroundContext | undefined>(
  undefined
);

export const PlaygroundProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<IFiles>({});
  const [entryFile, setEntryFile] = useState("");

  return (
    <PlaygroundContext.Provider
      value={{
        files,
        setFiles,
        entryFile,
        setEntryFile,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
};
