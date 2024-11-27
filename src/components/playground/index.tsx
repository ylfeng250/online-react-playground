import React, { useEffect } from "react";
import { Button, Layout, theme, Flex } from "antd";
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
  const [showPreview, setShowPreview] = React.useState(false);

  const { token } = theme.useToken();

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
        content: file.content || '',
        type: file.type || 'tsx'
      };
      return acc;
    }, {} as Record<string, { name: string; content: string; type: string }>);
    
    if (!entryFile || !filesForCompiler[entryFile]) {
      console.error('Entry file not found:', entryFile);
      return;
    }

    try {
      const res = compile(entryFile, filesForCompiler);
      setCompilerOutput(res.compileCode);
      return res;
    } catch (error) {
      console.error('Compilation error:', error);
      setCompilerOutput('');
    }
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
    <Layout style={{ height: "100vh", background: token.colorBgContainer }}>
      {/* Chat Column */}
      <Layout.Sider 
        width={300} 
        theme="light" 
        style={{ 
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer
        }}
      >
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ 
            padding: token.padding,
            height: '100%',
            color: token.colorTextSecondary,
            fontSize: token.fontSizeLG,
          }}
        >
          <div style={{ 
            textAlign: 'center',
            padding: token.paddingLG,
            background: token.colorBgElevated,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowTertiary,
            border: `1px solid ${token.colorBorderSecondary}`
          }}>
            Chat Component Coming Soon
          </div>
        </Flex>
      </Layout.Sider>
      
      {/* Main Content */}
      <Layout style={{ background: token.colorBgContainer }}>
        <Flex vertical style={{ height: '100%' }}>
          {/* Control Bar */}
          <Flex
            justify="space-between"
            align="center"
            style={{ 
              padding: `${token.paddingXS}px ${token.padding}px`,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated
            }}
          >
            <Button 
              type={showPreview ? "default" : "primary"}
              onClick={() => setShowPreview(!showPreview)}
              style={{ 
                borderRadius: token.borderRadius,
                fontWeight: 500
              }}
            >
              {showPreview ? '编辑代码' : '查看预览'}
            </Button>
          </Flex>

          {/* Main Area */}
          <Flex style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ 
              width: 240,
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgElevated,
              overflow: 'auto'
            }}>
              <FileExplorer onSelectFile={handleSelectFile} fileStructure={fileTree} />
            </div>
            <div style={{ flex: 1, position: 'relative', background: token.colorBgContainer }}>
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: showPreview ? 'none' : 'block',
                background: token.colorBgContainer
              }}>
                {currentFile && (
                  <CodeEditor
                    fileName={currentFile}
                    code={files[currentFile]?.content || ""}
                    onCodeChange={handleCodeChange}
                  />
                )}
              </div>
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: showPreview ? 'block' : 'none',
                background: token.colorBgContainer,
                padding: token.padding
              }}>
                <Preview code={compilerOutput} importmap={importmap} componentName={"App"} />
              </div>
            </div>
          </Flex>
        </Flex>
      </Layout>
    </Layout>
  );
};

export default Playground;
