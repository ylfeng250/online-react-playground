import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism.css";
// import "prismjs/themes/prism-dark.css";
import styles from "./index.module.css";

interface CodeEditorProps {
  fileName: string;
  code: string;
  onCodeChange: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  code,
  onCodeChange,
}) => {
  const getLanguage = (fileName: string) => {
    const extension = fileName.split(".").pop();
    switch (extension) {
      case "js":
        return languages.javascript;
      case "jsx":
        return languages.jsx;
      case "ts":
        return languages.typescript;
      case "tsx":
        return languages.tsx;
      case "html":
        return languages.markup;
      case "css":
        return languages.css;
      case "json":
        return languages.js;
      default:
        return languages.markup;
    }
  };

  return (
    <div className={styles["code-editor"]}>
      <Editor
        value={code}
        onValueChange={onCodeChange}
        highlight={(code) => highlight(code, getLanguage(fileName), fileName)}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          height: "100%",
        }}
      />
    </div>
  );
};

export default CodeEditor;
