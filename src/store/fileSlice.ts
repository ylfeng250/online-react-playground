import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileNode, FileState } from '../types/file';
import { buildFileTree } from '../utils/fileTree';

const initialState: FileState = {
  files: {},
  currentFile: null,
  fileTree: [],
  entryFile: null,
};

export const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<FileNode>) => {
      state.files[action.payload.id] = action.payload;
      state.fileTree = buildFileTree(Object.values(state.files));
    },
    updateFile: (state, action: PayloadAction<{ id: string; content: string }>) => {
      if (state.files[action.payload.id]) {
        state.files[action.payload.id].content = action.payload.content;
      }
    },
    deleteFile: (state, action: PayloadAction<string>) => {
      delete state.files[action.payload];
      state.fileTree = buildFileTree(Object.values(state.files));
      if (state.currentFile === action.payload) {
        state.currentFile = null;
      }
      if (state.entryFile === action.payload) {
        state.entryFile = null;
      }
    },
    setCurrentFile: (state, action: PayloadAction<string>) => {
      state.currentFile = action.payload;
    },
    setEntryFile: (state, action: PayloadAction<string>) => {
      state.entryFile = action.payload;
    },
  },
});

export const { addFile, updateFile, deleteFile, setCurrentFile, setEntryFile } = fileSlice.actions;

export default fileSlice.reducer;
