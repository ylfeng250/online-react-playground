import React from "react";
import Editor from "@monaco-editor/react";
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
        return "javascript";
      case "jsx":
        return "javascript";
      case "ts":
        return "typescript";
      case "tsx":
        return "typescript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      default:
        return "plaintext";
    }
  };

  return (
    <div className={styles["code-editor"]}>
      <Editor
        value={code}
        onChange={(value) => onCodeChange(value || "")}
        language={getLanguage(fileName)}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
};

export default CodeEditor;
