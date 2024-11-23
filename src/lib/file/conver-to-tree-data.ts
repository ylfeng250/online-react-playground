import { TreeNode } from "../../types/file-type";
type FileContents = { [key: string]: string };
export function convertToTreeData(fileContents: FileContents): TreeNode[] {
  const root: TreeNode[] = [];

  // Helper function to find or create a directory node
  function findOrCreateDir(
    path: string[],
    parent: TreeNode[],
    keyPrefix: string
  ): TreeNode[] {
    let currentLevel = parent;

    path.forEach((segment, index) => {
      let node = currentLevel.find((node) => node.title === segment);
      if (!node) {
        const newKey = `${keyPrefix}-${index}`;
        node = { title: segment, key: newKey, children: [] };
        currentLevel.push(node);
      }
      currentLevel = node.children!;
    });

    return currentLevel;
  }

  Object.keys(fileContents).forEach((filePath, fileIndex) => {
    const pathSegments = filePath.split("/");
    const fileName = pathSegments.pop()!; // Last segment is the file name
    const isLeaf = fileName.includes(".");

    // Find or create directories
    const dir = findOrCreateDir(pathSegments, root, `0`);

    // Add the file to the directory
    dir.push({
      title: fileName,
      key: `${fileIndex}`,
      isLeaf,
    });
  });

  return root;
}
