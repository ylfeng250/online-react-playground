import React, { useState } from "react";
import { Tree, Dropdown, Modal, Form, Input, message } from "antd";
import { FolderOutlined, FileOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { FileNode } from "../../types/file";
import { useDispatch } from "react-redux";
import { addFile, deleteFile, updateFile } from "../../store/fileSlice";
import { v4 as uuidv4 } from 'uuid';

interface FileExplorerProps {
  fileStructure: FileNode[];
  onSelectFile: (fileName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  fileStructure,
  onSelectFile,
}) => {
  const dispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'new-file' | 'new-folder' | 'rename'>();
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [form] = Form.useForm();

  const renderIcon = (node: FileNode) => {
    if (!node.isDirectory) {
      return <FileOutlined />;
    }
    return <FolderOutlined />;
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const { name } = values;
      
      if (modalMode === 'new-file' || modalMode === 'new-folder') {
        const newNode: FileNode = {
          id: uuidv4(),
          name,
          content: '',
          path: selectedNode ? `${selectedNode.path}/${name}` : `/${name}`,
          isDirectory: modalMode === 'new-folder',
          parentId: selectedNode?.id,
          type: name.split('.').pop() as any,
        };
        dispatch(addFile(newNode));
      } else if (modalMode === 'rename' && selectedNode) {
        const updatedNode = {
          ...selectedNode,
          name,
          path: selectedNode.path.replace(selectedNode.name, name),
        };
        dispatch(updateFile({...updatedNode, id: selectedNode.id}));
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (node: FileNode) => {
    if (node.name === 'package.json') {
      message.error('package.json cannot be deleted');
      return;
    }
    Modal.confirm({
      title: 'Confirm Delete',
      content: `Are you sure you want to delete ${node.name}?`,
      onOk: () => dispatch(deleteFile(node.id)),
    });
  };

  const getContextMenuItems = (node: FileNode) => {
    const items = [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: 'Rename',
        disabled: node.name === 'package.json',
        onClick: () => {
          setSelectedNode(node);
          setModalMode('rename');
          form.setFieldsValue({ name: node.name });
          setIsModalVisible(true);
        },
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        disabled: node.name === 'package.json',
        onClick: () => handleDelete(node),
      },
    ];

    if (node.isDirectory) {
      return [
        {
          key: 'new-file',
          icon: <FileOutlined />,
          label: 'New File',
          onClick: () => {
            setSelectedNode(node);
            setModalMode('new-file');
            setIsModalVisible(true);
          },
        },
        {
          key: 'new-folder',
          icon: <FolderOutlined />,
          label: 'New Folder',
          onClick: () => {
            setSelectedNode(node);
            setModalMode('new-folder');
            setIsModalVisible(true);
          },
        },
        ...items,
      ];
    }

    return items;
  };

  const convertToAntdTreeData = (nodes: FileNode[]): { 
    key: string; 
    title: React.ReactNode; 
    isLeaf: boolean; 
    children?: { 
      key: string; 
      title: React.ReactNode; 
      isLeaf: boolean; 
      children?: any; 
      icon?: React.ReactNode; 
    }[]; 
    icon?: React.ReactNode; 
  }[] => {
    return nodes.map(node => ({
      key: node.id,
      title: (
        <Dropdown
          menu={{ items: getContextMenuItems(node) }}
          trigger={['contextMenu']}
        >
          <span>{node.name}</span>
        </Dropdown>
      ),
      isLeaf: !node.isDirectory,
      children: node.children ? convertToAntdTreeData(node.children) : undefined,
      icon: renderIcon(node)
    }));
  };

  const onSelect = (selectedKeys: any[], info: any) => {
    if (info.node.isLeaf) {
      onSelectFile(info.node.key as string);
    }
  };

  const treeData = convertToAntdTreeData(fileStructure);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
        <Dropdown
          menu={{
            items: [
              {
                key: 'new-file-root',
                icon: <FileOutlined />,
                label: 'New File',
                onClick: () => {
                  setSelectedNode(null);
                  setModalMode('new-file');
                  setIsModalVisible(true);
                },
              },
              {
                key: 'new-folder-root',
                icon: <FolderOutlined />,
                label: 'New Folder',
                onClick: () => {
                  setSelectedNode(null);
                  setModalMode('new-folder');
                  setIsModalVisible(true);
                },
              },
            ],
          }}
        >
          <PlusOutlined style={{ cursor: 'pointer' }} />
        </Dropdown>
      </div>
      <Tree
        showLine={{ showLeafIcon: false }}
        showIcon={true}
        defaultExpandAll
        onSelect={onSelect}
        treeData={treeData}
      />
      <Modal
        title={
          modalMode === 'new-file'
            ? 'New File'
            : modalMode === 'new-folder'
            ? 'New Folder'
            : 'Rename'
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please input the name!' },
              {
                validator: (_, value) => {
                  if (value && value.includes('/')) {
                    return Promise.reject('Name cannot contain "/"');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FileExplorer;
