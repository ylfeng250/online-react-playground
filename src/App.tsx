import { useState } from "react";
import { Preview } from "./components/Preview";
import { compile } from "./lib/compiler";
import { IFiles } from "./types/file-type";
import ComponentRaw from "./example/Component?raw";
import ComponentCss from "./example/Component.css?raw";
function App() {
  const [entryFile, setEntryFile] = useState("./index.tsx");
  const [files, setFiles] = useState<IFiles>({
    "./index.tsx": {
      name: "./index.tsx",
      content: ComponentRaw,
    },
    "./Component.css": {
      name: "./Component.css",
      content: ComponentCss,
    },
  });
  const [compiledCode, setCompiledCode] = useState("");
  const handleCompile = () => {
    console.log(files);
    console.log(entryFile);
    const result = compile(entryFile, files);
    setCompiledCode(result.compileCode);
    console.log(result.compileCode);
    return result;
  };
  return (
    <div>
      <button onClick={handleCompile}>编译</button>
      <Preview
        code={compiledCode}
        importmap={{
          imports: {
            react: "https://esm.sh/react",
            "react-dom": "https://esm.sh/react-dom",
            "react-dom/client": "https://esm.sh/react-dom/client",
            antd: "https://esm.sh/antd?bundle",
          },
        }}
      />
    </div>
  );
}

export default App;
