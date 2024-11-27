import React, { useEffect } from "react";
import { Splitter } from "antd";
import FileExplorer from "../file-explorer";
import CodeEditor from "../code-editor";
import { compile, generateImportMap } from "../../lib/compiler";
import { Preview } from "../preview";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addFile, setCurrentFile, updateFile } from "../../store/fileSlice";
import { FileNode } from "../../types/file";

// 初始化文件内容
const initialFiles: FileNode[] = [
  {
    id: "./App.css",
    name: "App.css",
    path: "./App.css",
    content: "body {\n  background-color: #f0f0f0;\n}",
    type: "css",
    isDirectory: false
  },
  {
    id: "./App.tsx",
    name: "App.tsx",
    path: "./App.tsx",
    content: `import "./App.css";
  
function App() {
  return <div className="App">Hello World!</div>;
}

export default App;
`,
    type: "tsx",
    isDirectory: false
  },
  {
    id: "package.json",
    name: "package.json",
    path: "package.json",
    content: `{
  "main": "./App.tsx",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
    type: "json",
    isDirectory: false
  }
];

const Playground: React.FC = () => {
  const dispatch = useAppDispatch();
  const files = useAppSelector((state) => state.file.files);
  const currentFile = useAppSelector((state) => state.file.currentFile);
  const fileTree = useAppSelector((state) => state.file.fileTree);
  const [compilerOutput, setCompilerOutput] = React.useState("");

  // 初始化文件
  useEffect(() => {
    if (Object.keys(files).length === 0) {
      initialFiles.forEach((file) => {
        dispatch(addFile(file));
      });
    }
  }, [dispatch]);

  const entryFile = React.useMemo(() => {
    try {
      const pkgFile = files["package.json"];
      if (!pkgFile) {
        return "./App.tsx";
      }
      const pkg = JSON.parse(pkgFile.content);
      return pkg.main;
    } catch (e) {
      return "./App.tsx";
    }
  }, [files]);

  const importmap = React.useMemo(() => {
    try {
      const pkgFile = files["package.json"];
      if (!pkgFile) {
        return { imports: {} };
      }
      const pkg = JSON.parse(pkgFile.content);
      return generateImportMap(pkg.dependencies);
    } catch (e) {
      return {
        imports: {},
      };
    }
  }, [files]);

  const compileCode = async () => {
    const filesForCompiler = Object.values(files).reduce((acc, file) => {
      acc[file.path] = {
        name: file.path,
        content: file.content,
        type: file.type || 'tsx'
      };
      return acc;
    }, {} as any);
    
    const res = compile(entryFile, filesForCompiler);
    setCompilerOutput(res.compileCode);
  };

  const handleSelectFile = (fileName: string) => {
    dispatch(setCurrentFile(fileName));
  };

  const handleCodeChange = (newCode: string) => {
    if (currentFile) {
      dispatch(updateFile({ id: currentFile, content: newCode }));
    }
  };

  useEffect(() => {
    compileCode();
  }, [files, entryFile]);

  return (
    <Splitter>
      <Splitter.Panel defaultSize={200}>
        <FileExplorer onSelectFile={handleSelectFile} fileStructure={fileTree} />
      </Splitter.Panel>
      <Splitter.Panel>
        <Splitter>
          <Splitter.Panel>
            {currentFile ? (
              <CodeEditor
                fileName={currentFile}
                code={files[currentFile]?.content || ""}
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
