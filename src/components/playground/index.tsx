import React, { useEffect, useState } from "react";
import { Layout, theme } from "antd";
import FileExplorer from "../file-explorer";
import CodeEditor from "../code-editor";
import { Preview } from "../preview";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addFile, setCurrentFile, updateFile } from "../../store/fileSlice";
import { FileNode } from "../../types/file";
import CustomButtonRaw from "../../example/CustomButton.tsx?raw";
import CustomButtonCss from "../../example/CustomButton.css?raw";
import pkgRaw from "../../example/package.json?raw";
import { fileSystem } from "../../lib/fs";

// 初始化文件内容
const initialFiles: FileNode[] = [
  {
    id: "CustomButton.css",
    name: "CustomButton.css",
    path: "CustomButton.css",
    content: CustomButtonCss,
    type: "css",
    isDirectory: false
  },
  {
    id: "CustomButton.tsx",
    name: "CustomButton.tsx",
    path: "CustomButton.tsx",
    content: CustomButtonRaw,
    type: "tsx",
    isDirectory: false
  },
  {
    id: "package.json",
    name: "package.json",
    path: "package.json",
    content: pkgRaw,
    type: "json",
    isDirectory: false
  }
];

const Playground: React.FC = () => {
  const dispatch = useAppDispatch();
  const files = useAppSelector((state) => state.file.files);
  const currentFile = useAppSelector((state) => state.file.currentFile);
  const [compiledCode, setCompiledCode] = useState("");
  const [compileError, setCompileError] = useState<string | null>(null);
  const { token } = theme.useToken();

  // 初始化文件系统和编译器
  useEffect(() => {
    const init = async () => {
      try {
        await fileSystem.initializeCompiler();
        fileSystem.initializeFiles(initialFiles);
        initialFiles.forEach((file) => {
          dispatch(addFile(file));
        });
        dispatch(setCurrentFile(initialFiles[1])); // 设置 CustomButton.tsx 为默认文件
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };
    init();
  }, [dispatch]);

  // 当文件内容改变时重新编译
  useEffect(() => {
    const compile = async () => {
      try {
        setCompileError(null);
        const compiled = await fileSystem.compile("CustomButton.tsx");
        setCompiledCode(compiled);
      } catch (error) {
        console.error("Compilation error:", error);
        setCompileError(error instanceof Error ? error.message : String(error));
      }
    };

    if (files.length > 0) {
      compile();
    }
  }, [files]);

  const handleFileChange = (content: string) => {
    if (currentFile) {
      dispatch(updateFile({ ...currentFile, content }));
    }
  };

  const handleSelectFile = (fileId: string) => {
    const selectedFile = files.find(file => file.id === fileId);
    if (selectedFile) {
      dispatch(setCurrentFile(selectedFile));
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Layout.Sider
        width={250}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorder}`,
        }}
      >
        <FileExplorer fileStructure={files} onSelectFile={handleSelectFile} />
      </Layout.Sider>
      <Layout>
        <Layout.Content style={{ display: "flex" }}>
          <div style={{ flex: 1, borderRight: `1px solid ${token.colorBorder}` }}>
            {currentFile && (
              <CodeEditor
                code={currentFile.content}
                onCodeChange={handleFileChange}
                fileName={currentFile.name}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            {compileError ? (
              <div style={{ padding: 16, color: "red" }}>
                <h3>Compilation Error:</h3>
                <pre>{compileError}</pre>
              </div>
            ) : (
              <Preview code={compiledCode} />
            )}
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default Playground;
