import { fs } from '@zenfs/core';
import { transform } from "@babel/standalone";
import * as esbuild from 'esbuild-wasm';
import { FileNode } from '../../types/file';
import { IFile, IFiles } from "../../types/file-type";

const babelPresets = ["react", "typescript"];

class FileSystem {
  private fs: typeof fs
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.fs = fs;
  }

  // 初始化编译器
  async initializeCompiler() {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (!this.initialized) {
          try {
            await esbuild.initialize({
              wasmURL: 'https://unpkg.com/esbuild-wasm@0.20.2/esbuild.wasm',
            });
            this.initialized = true;
          } catch (error: any) {
            // 如果是已经初始化的错误，我们认为初始化成功
            if (error.message.includes('initialize')) {
              this.initialized = true;
              return;
            }
            throw error;
          }
        }
      })();
    }
    return this.initPromise;
  }

  // 初始化文件系统
  initializeFiles(files: FileNode[]) {
    files.forEach((file) => {
      if (!file.isDirectory) {
        const dirPath = this.getDirPath(file.path);
        if (!this.fs.existsSync(dirPath)) {
          this.fs.mkdirSync(dirPath, { recursive: true });
        }
        this.fs.writeFileSync(file.path, file.content);
      }
    });
  }

  // 写入文件
  writeFile(path: string, content: string) {
    const dirPath = this.getDirPath(path);
    if (!this.fs.existsSync(dirPath)) {
      this.fs.mkdirSync(dirPath, { recursive: true });
    }
    this.fs.writeFileSync(path, content);
  }

  // 读取文件
  readFile(path: string): string {
    try {
      return this.fs.readFileSync(path, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      throw error;
    }
  }

  // 删除文件
  deleteFile(path: string) {
    try {
      this.fs.unlinkSync(path);
      // 删除空目录
      this.cleanEmptyDirectories(this.getDirPath(path));
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      throw error;
    }
  }

  // 检查文件是否存在
  exists(path: string): boolean {
    return this.fs.existsSync(path);
  }

  // 获取目录路径
  private getDirPath(filePath: string): string {
    // 移除开头的 ./
    const path = filePath.replace(/^\.\//, '');
    const lastSlashIndex = path.lastIndexOf('/');
    // 如果没有斜杠，说明文件在根目录
    return lastSlashIndex === -1 ? '/' : path.substring(0, lastSlashIndex);
  }

  // 递归删除空目录
  private cleanEmptyDirectories(dirPath: string) {
    try {
      const files = this.fs.readdirSync(dirPath);
      if (files.length === 0) {
        this.fs.rmdirSync(dirPath);
        const parentDir = this.getDirPath(dirPath);
        if (parentDir) {
          this.cleanEmptyDirectories(parentDir);
        }
      }
    } catch (error) {
      console.error(`Error cleaning empty directories at ${dirPath}:`, error);
    }
  }

  // 获取文件系统实例
  getFs() {
    return this.fs;
  }

  // 编译相关方法
  private beforeCompile(filename: string, code: string) {
    let _code = code;
    const regexReact = /import\s+React/g;
    if (
      (filename.endsWith(".jsx") || filename.endsWith(".tsx")) &&
      !regexReact.test(code)
    ) {
      _code = `import React from 'react';\n${code}`;
    }
    return _code;
  }

  private getModuleFile(files: IFiles, moduleName: string) {
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    const normalizedName = moduleName.replace(/^\.?\//, '');
    
    const exactMatch = Object.values(files).find((file) => {
      const normalizedFileName = file.name.replace(/^\.?\//, '');
      return normalizedFileName === normalizedName || normalizedFileName === moduleName;
    });
    if (exactMatch) return exactMatch;

    for (const ext of extensions) {
      const fileWithExt = Object.values(files).find((file) => {
        const normalizedFileName = file.name.replace(/^\.?\//, '');
        return normalizedFileName === normalizedName + ext || 
               normalizedFileName === moduleName + ext;
      });
      if (fileWithExt) return fileWithExt;
    }
    
    return undefined;
  }

  private filePathResolver(files: IFiles): any {
    return {
      name: "file-path-resolver",
      visitor: {
        ImportDeclaration: (path: any) => {
          const moduleName = path.node.source.value;
          const moduleFile = this.getModuleFile(files, moduleName);
          
          if (moduleFile) {
            let newSource;
            if (moduleFile.type === "json") {
              newSource = this.json2Js(moduleFile);
            } else if (moduleFile.type === "css") {
              newSource = this.css2Js(moduleFile);
            } else {
              const code = this.babelTransform(moduleFile.name, moduleFile.content, files);
              newSource = URL.createObjectURL(
                new Blob([code], { type: "application/javascript" })
              );
            }
            path.node.source.value = newSource;
          }
        },
      },
    };
  }

  private babelTransform(filename: string, code: string, files: IFiles) {
    let result = "";
    const _code = this.beforeCompile(filename, code);
    try {
      result = transform(_code, {
        filename,
        presets: babelPresets,
        plugins: [this.filePathResolver(files)],
        sourceMaps: false,
      }).code!;
    } catch (error) {
      result = `Error: ${error}`;
    }
    return result;
  }

  private json2Js(file: any) {
    const js = `export default ${JSON.stringify(file.value)}`;
    return URL.createObjectURL(
      new Blob([js], { type: "application/javascript" })
    );
  }

  private css2Js(file: IFile) {
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
  }

  // 使用 esbuild 编译代码
  async compile(entryPoint: string): Promise<string> {
    await this.initializeCompiler();

    try {
      const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        format: 'esm',
        target: ['es2020'],
        plugins: [
          {
            name: 'zenfs',
            setup: (build) => {
              build.onResolve({ filter: /.*/ }, args => {
                if (args.importer === '') {
                  return { path: args.path, namespace: 'zenfs' };
                }
                const dirname = args.importer.split('/').slice(0, -1).join('/');
                const path = dirname ? `${dirname}/${args.path}` : args.path;
                return { path, namespace: 'zenfs' };
              });

              build.onLoad({ filter: /.*/, namespace: 'zenfs' }, args => {
                const contents = this.readFile(args.path);
                let loader: esbuild.Loader = 'tsx';
                if (args.path.endsWith('.css')) {
                  loader = 'css';
                } else if (args.path.endsWith('.json')) {
                  loader = 'json';
                }
                return { contents, loader };
              });
            },
          },
        ],
      });

      return result.outputFiles[0].text;
    } catch (error) {
      console.error('Compilation error:', error);
      throw error;
    }
  }
}

export const fileSystem = new FileSystem();
