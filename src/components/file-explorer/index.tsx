import React from "react";
import { Tree, TreeProps } from "antd";
import { FolderOutlined, FileOutlined } from "@ant-design/icons";

interface FileExplorerProps {
  fileStructure: any[];
  onSelectFile: (fileName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  fileStructure,
  onSelectFile,
}) => {
  const renderIcon = (node: any) => {
    if (node.isLeaf) {
      return <FileOutlined />;
    }
    return <FolderOutlined />;
  };

  const onSelect: TreeProps["onSelect"] = (selectedKeys, info) => {
    if (info.node.isLeaf) {
      onSelectFile(info.node.key as string);
    }
  };

  return (
    <Tree
      showLine={{ showLeafIcon: false }}
      showIcon={true}
      icon={renderIcon}
      defaultExpandedKeys={["0-0", "0-1"]}
      onSelect={onSelect}
      treeData={fileStructure}
    />
  );
};

export default FileExplorer;
