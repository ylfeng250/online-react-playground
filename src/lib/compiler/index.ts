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
    result = `Error: ${error}`;
  }
  return result;
};

export const getModuleFile = (files: IFiles, moduleName: string) => {
  // 支持的文件扩展名
  const extensions = ['.tsx', '.ts', '.jsx', '.js'];
  
  // 处理路径，移除开头的 ./ 或 /
  const normalizedName = moduleName.replace(/^\.?\//, '');
  
  // 首先尝试直接匹配完整文件名
  const exactMatch = Object.values(files).find((file) => {
    const normalizedFileName = file.name.replace(/^\.?\//, '');
    return normalizedFileName === normalizedName || normalizedFileName === moduleName;
  });
  if (exactMatch) return exactMatch;

  // 如果没有找到，尝试添加不同的扩展名进行匹配
  for (const ext of extensions) {
    const fileWithExt = Object.values(files).find((file) => {
      const normalizedFileName = file.name.replace(/^\.?\//, '');
      return normalizedFileName === normalizedName + ext || 
             normalizedFileName === moduleName + ext;
    });
    if (fileWithExt) return fileWithExt;
  }
  
  return undefined;
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

export const generateImportMap = (dependencies: Record<string, string>) => {
  const importMap = Object.entries(dependencies).reduce(
    (acc, [key, value]) => {
      // "@ali/react-button": "^5.1.1"
      const pkgName = key;
      const imports = acc.imports;
      if (Object.keys(imports).includes(pkgName)) {
        return acc;
      }
      let version = "";
      if (value.startsWith("^")) {
        version = value.slice(1);
      } else {
        version = value;
      }
      // NOTICE: 可能还有其他的情况
      return {
        ...acc,
        imports: {
          ...acc.imports,
          [pkgName]: `https://esm.sh/${pkgName}@${version}?bundle`,
        },
      };
    },
    {
      imports: {
        react: "https://esm.sh/react",
        "react-dom": "https://esm.sh/react-dom",
        "react-dom/client": "https://esm.sh/react-dom/client",
      },
    }
  );
  return importMap;
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
