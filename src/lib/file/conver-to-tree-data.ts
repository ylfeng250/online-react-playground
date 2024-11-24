import { IFiles, TreeNode } from "../../types/file-type";
type FileContents = { [key: string]: string };

function buildDirectoryTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  paths.forEach((path) => {
    const parts = path.split("/"); // 按路径分隔
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1 && /\.[a-zA-Z0-9]+$/.test(part); // 判断是否是文件
      const currentPath = parts.slice(0, index + 1).join("/"); // 构建当前节点的路径
      const existingNode = currentLevel.find((node) => node.title === part);

      if (existingNode) {
        // 如果节点已存在，继续深入子级
        if (!existingNode.isLeaf && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        // 创建新节点
        const newNode: TreeNode = {
          title: part,
          key: currentPath,
          isLeaf: isFile,
        };

        if (!isFile) {
          newNode.children = []; // 如果是目录，初始化子节点数组
        }

        currentLevel.push(newNode);

        // 如果是目录类型，继续向下深入
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    });
  });

  return root;
}

export function convertToTreeData(fileContents: IFiles): TreeNode[] {
  const paths = Object.keys(fileContents);
  const root = buildDirectoryTree(paths);

  return root;
}
