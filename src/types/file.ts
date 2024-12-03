export interface FileNode {
  id: string;
  name: string;
  content: string;
  path: string;
  children?: FileNode[];
  isDirectory: boolean;
  parentId?: string;
  type?: 'tsx' | 'ts' | 'js' | 'jsx' | 'css' | 'json' | 'directory';
}

export interface FileState {
  files: { [key: string]: FileNode };
  currentFile: string | null;
  fileTree: FileNode[];
  entryFile: string | null;
}
