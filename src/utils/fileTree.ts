import { FileNode } from '../types/file';

export function buildFileTree(files: FileNode[]): FileNode[] {
  const fileMap = new Map<string, FileNode>();
  const rootNodes: FileNode[] = [];

  // First pass: create a map of all files
  files.forEach(file => {
    fileMap.set(file.id, { ...file, children: [] });
  });

  // Second pass: build the tree structure
  files.forEach(file => {
    const node = fileMap.get(file.id)!;
    if (file.parentId) {
      const parent = fileMap.get(file.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  // Sort function to put directories first and then sort alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    return nodes.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });
  };

  // Sort all levels of the tree
  const sortTree = (nodes: FileNode[]) => {
    nodes.forEach(node => {
      if (node.children) {
        node.children = sortTree(node.children);
      }
    });
    return sortNodes(nodes);
  };

  return sortTree(rootNodes);
}
