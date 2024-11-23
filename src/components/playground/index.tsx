import React, { useMemo, useState } from "react";
import { Layout, Splitter } from "antd";
import FileExplorer from "../file-explorer";
import CodeEditor from "../code-editor";
import { convertToTreeData } from "../../lib/file/conver-to-tree-data";

// 模拟文件内容
const initialFileContents: { [key: string]: string } = {
  "Button.tsx":
    'import React from "react";\n\nconst Button = () => {\n  return <button>Click me</button>;\n};\n\nexport default Button;',
  "Input.tsx":
    'import React from "react";\n\nconst Input = () => {\n  return <input placeholder="Type here" />;\n};\n\nexport default Input;',
  "index.tsx":
    'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));',
  "about.tsx":
    'import React from "react";\n\nconst About = () => {\n  return <h1>About Page</h1>;\n};\n\nexport default About;',
  "App.tsx":
    'import React from "react";\n\nconst App = () => {\n  return <div>Hello, World!</div>;\n};\n\nexport default App;',
  "index.html":
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>',
};

const Playground: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState(initialFileContents);

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
        [selectedFile]: newCode,
      }));
    }
  };

  return (
    <Splitter>
      <Splitter.Panel defaultSize={200}>
        <FileExplorer
          onSelectFile={handleSelectFile}
          fileStructure={fileStructure}
        />
      </Splitter.Panel>
      <Splitter.Panel>
        {selectedFile ? (
          <CodeEditor
            fileName={selectedFile}
            code={fileContents[selectedFile] || ""}
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
            Select a file to view its content
          </div>
        )}
      </Splitter.Panel>
    </Splitter>
  );
};

export default Playground;
