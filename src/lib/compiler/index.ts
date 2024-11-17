import { transform } from "@babel/standalone";
import { IFile, IFiles } from "../../types/file-type";

const babelPresets = ["react", "typescript"];

const beforeCompile = (filename: string, code: string) => {
  let _code = code;
  const regexReact = /import\s+React/g;
  if (
    (filename.endsWith(".jsx") || filename.endsWith(".tsx")) &&
    !regexReact.test(code)
  ) {
    _code = `import React from 'react';\n${code}`;
  }

  return _code;
};
const babelTransform = (filename: string, code: string, files: IFiles) => {
  let result = "";
  const _code = beforeCompile(filename, code);
  try {
    result = transform(_code, {
      filename,
      presets: babelPresets,
      plugins: [filePathResolver(files)],
      sourceMaps: false,
    }).code!;
  } catch (error) {
    // TODO: 错误处理
    result = `Error: ${error}`;
  }
  return result;
};

export const getModuleFile = (files: IFiles, moduleName: string) => {
  return Object.values(files).find((file) => file.name === moduleName);
};

export const json2Js = (file: any) => {
  const js = `export default ${JSON.stringify(file.value)}`;
  return URL.createObjectURL(
    new Blob([js], { type: "application/javascript" })
  );
};

export const css2Js = (file: IFile) => {
  const js = `
    (() => {
    let stylesheet = document.getElementById('style_${file.name}');
    if (!stylesheet) {
        stylesheet = document.createElement('style')
        stylesheet.setAttribute('id', 'style_${file.name}')
        document.head.appendChild(stylesheet)
    }
    const styles = document.createTextNode(\`${file.content}\`)
    stylesheet.innerHTML = ''
    stylesheet.appendChild(styles)
    })()
    `;
  return URL.createObjectURL(
    new Blob([js], { type: "application/javascript" })
  );
};
export const filePathResolver = (files: IFiles) => {
  return {
    visitor: {
      ImportDeclaration(path: any) {
        const moduleName: string = path.node.source.value;
        // 如果是相对路径，则替换为blob地址
        if (moduleName.startsWith(".")) {
          const module = getModuleFile(files, moduleName);
          if (!module) return;
          if (module.name.endsWith(".css")) {
            path.node.source.value = css2Js(module);
          } else if (module.name.endsWith(".json")) {
            path.node.source.value = json2Js(module);
          } else {
            path.node.source.value = URL.createObjectURL(
              new Blob([babelTransform(module.name, module.content, files)], {
                type: "application/javascript",
              })
            );
          }
        }
      },
    },
  };
};

export const compile = (enrty: string, files: IFiles) => {
  const main = files[enrty];
  const compileCode = babelTransform(enrty, main.content, files);
  return { compileCode };
};
