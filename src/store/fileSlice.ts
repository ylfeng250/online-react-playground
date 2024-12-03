import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FileNode } from "../types/file";
import { fileSystem } from "../lib/fs";

interface FileState {
  files: FileNode[];
  currentFile: FileNode | null;
  fileTree: FileNode[];
}

const initialState: FileState = {
  files: [],
  currentFile: null,
  fileTree: [],
};

const fileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<FileNode>) => {
      state.files.push(action.payload);
      if (!action.payload.isDirectory) {
        fileSystem.writeFile(action.payload.path, action.payload.content);
      }
      // 更新文件树
      state.fileTree = buildFileTree(state.files);
    },
    updateFile: (state, action: PayloadAction<FileNode>) => {
      const index = state.files.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.files[index] = action.payload;
        if (!action.payload.isDirectory) {
          fileSystem.writeFile(action.payload.path, action.payload.content);
        }
        if (state.currentFile?.id === action.payload.id) {
          state.currentFile = action.payload;
        }
      }
    },
    deleteFile: (state, action: PayloadAction<string>) => {
      const file = state.files.find((f) => f.id === action.payload);
      if (file && !file.isDirectory) {
        fileSystem.deleteFile(file.path);
      }
      state.files = state.files.filter((f) => f.id !== action.payload);
      if (state.currentFile?.id === action.payload) {
        state.currentFile = null;
      }
      // 更新文件树
      state.fileTree = buildFileTree(state.files);
    },
    setCurrentFile: (state, action: PayloadAction<FileNode>) => {
      state.currentFile = action.payload;
    },
  },
});

// 构建文件树的辅助函数
function buildFileTree(files: FileNode[]): FileNode[] {
  const tree: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // 首先创建所有目录节点
  files.forEach((file) => {
    const parts = file.path.split('/');
    let currentPath = '';
    
    parts.forEach((part, index) => {
      currentPath = index === 0 ? part : `${currentPath}/${part}`;
      
      if (!map.has(currentPath)) {
        const isLast = index === parts.length - 1;
        const node: FileNode = {
          id: currentPath,
          name: part,
          path: currentPath,
          content: isLast ? file.content : '',
          type: isLast ? file.type : 'directory',
          isDirectory: !isLast,
        };
        map.set(currentPath, node);
        
        if (index === 0) {
          tree.push(node);
        } else {
          const parentPath = parts.slice(0, index).join('/');
          const parent = map.get(parentPath);
          if (parent) {
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(node);
          }
        }
      }
    });
  });

  return tree;
}

export const { addFile, updateFile, deleteFile, setCurrentFile } = fileSlice.actions;
export default fileSlice.reducer;
