import React, { useEffect, useMemo, useState } from "react";
import { Splitter } from "antd";
import FileExplorer from "../file-explorer";
import CodeEditor from "../code-editor";
import { convertToTreeData } from "../../lib/file/conver-to-tree-data";
import { IFiles } from "../../types/file-type";
import { compile, generateImportMap } from "../../lib/compiler";
import { Preview } from "../preview";

// 模拟文件内容
const initialFileContents: IFiles = {
  "./App.css": {
    name: "./App.css",
    content: "body {\n  background-color: #f0f0f0;\n}",
    type: "css",
  },
  "./App.tsx": {
    name: "./App.tsx",
    content: `import "./App.css";
  
  function App() {
    return <div className="App">Hello World!</div>;
  }
  
  export default App;
  `,
    type: "tsx",
  },
  "package.json": {
    name: "package.json",
    content: `
  {
    "main": "./App.tsx",
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    }
  }
  `,
    type: "json",
  },
};

const Playground: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState(initialFileContents);
  const [compilerOutput, setCompilerOutput] = useState("");
  const entryFile = useMemo(() => {
    try {
      const pkg = JSON.parse(fileContents["package.json"]?.content);
      if (!pkg) {
        return "./App.tsx";
      }
      return pkg.main;
    } catch (e) {
      return "./App.tsx";
    }
  }, [fileContents]);

  const importmap = useMemo(() => {
    try {
      const pkg = JSON.parse(fileContents["package.json"]?.content);
      return generateImportMap(pkg.dependencies);
    } catch (e) {
      return {
        imports: {},
      };
    }
  }, [fileContents]);
  const compileCode = async (files: IFiles, entryFile: string) => {
    const res = compile(entryFile, files);
    setCompilerOutput(res.compileCode);
  };

  const fileStructure = useMemo(() => {
    return convertToTreeData(initialFileContents);
  }, [fileContents]);
  const handleSelectFile = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleCodeChange = (newCode: string) => {
    if (selectedFile) {
      setFileContents((prev) => ({
        ...prev,
        [selectedFile]: {
          ...prev[selectedFile],
          content: newCode,
        },
      }));
    }
  };

  useEffect(() => {
    compileCode(fileContents, entryFile);
  }, [fileContents]);

  return (
    <Splitter>
      <Splitter.Panel defaultSize={200}>
        <FileExplorer
          onSelectFile={handleSelectFile}
          fileStructure={fileStructure}
        />
      </Splitter.Panel>
      <Splitter.Panel>
        <Splitter>
          <Splitter.Panel>
            {selectedFile ? (
              <CodeEditor
                fileName={selectedFile}
                code={fileContents[selectedFile].content || ""}
                onCodeChange={handleCodeChange}
              />
            ) : (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  height: "100%",
                }}
              >
                选择一个文件进行内容预览
              </div>
            )}
          </Splitter.Panel>
          <Splitter.Panel>
            <Preview
              code={compilerOutput}
              importmap={importmap}
              componentName={"App"}
            />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
    </Splitter>
  );
};

export default Playground;
