export interface IFile {
  // 文件名
  name: string;
  // 文件内容
  content: string;
  // 文件类型
  type?: string;
}

export interface IFiles {
  [key: string]: IFile;
}

export interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
  isLeaf?: boolean;
}
