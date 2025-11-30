import { FileNode } from '../types';

export const countSourceFiles = (nodes: FileNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (node.is_source_file) count++;
    if (node.children) count += countSourceFiles(node.children);
  }
  return count;
};

export const getAllSourceFiles = (nodes: FileNode[]): string[] => {
  const sourceFiles: string[] = [];
  for (const node of nodes) {
    if (node.is_source_file) {
      sourceFiles.push(node.path);
    }
    if (node.children) {
      sourceFiles.push(...getAllSourceFiles(node.children));
    }
  }
  return sourceFiles;
};

export const getSourceFilesInDirectory = (node: FileNode): string[] => {
  const sourceFiles: string[] = [];
  if (node.is_source_file) {
    sourceFiles.push(node.path);
  }
  if (node.children) {
    for (const child of node.children) {
      sourceFiles.push(...getSourceFilesInDirectory(child));
    }
  }
  return sourceFiles;
};

export const getNodeByPath = (nodes: FileNode[], targetPath: string): FileNode | null => {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children) {
      const found = getNodeByPath(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
};

export const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const iconMap: { [key: string]: string } = {
    'js': '🟨', 'ts': '🔷', 'jsx': '⚛️', 'tsx': '⚛️',
    'py': '🐍', 'rs': '🦀', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
    'html': '🌐', 'css': '🎨', 'scss': '🎨', 'sass': '🎨',
    'json': '📋', 'xml': '📄', 'yaml': '📝', 'yml': '📝',
    'md': '📖', 'txt': '📄', 'go': '🐹', 'php': '🐘',
    'rb': '💎', 'swift': '🦉', 'kt': '🎯', 'dart': '🎯'
  };
  return iconMap[ext] || '📄';
};

export const generateFileTreeStructure = (nodes: FileNode[], prefix: string = ""): string => {
  let result = "";
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const currentPrefix = prefix + (isLast ? "└── " : "├── ");
    const nextPrefix = prefix + (isLast ? "    " : "│   ");
    
    if (node.is_directory) {
      result += `${currentPrefix}📁 ${node.name}/\n`;
      if (node.children && node.children.length > 0) {
        result += generateFileTreeStructure(node.children, nextPrefix);
      }
    } else {
      const icon = getFileIcon(node.name);
      const tokenInfo = node.is_source_file && node.token_count 
        ? ` (${node.token_count.toLocaleString()} tokens)` 
        : node.is_source_file ? "" : " (non-source)";
      result += `${currentPrefix}${icon} ${node.name}${tokenInfo}\n`;
    }
  }
  
  return result;
};

const buildFileMapTree = (nodes: FileNode[], prefix: string, selectedFiles: Set<string>): string => {
  let result = "";

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const currentPrefix = prefix + (isLast ? "└── " : "├── ");
    const nextPrefix = prefix + (isLast ? "    " : "│   ");

    const isSelected = selectedFiles.has(node.path);
    const label = node.is_directory ? node.name : `${node.name}${isSelected ? " *" : ""}`;

    result += `${currentPrefix}${label}\n`;

    if (node.children && node.children.length > 0) {
      result += buildFileMapTree(node.children, nextPrefix, selectedFiles);
    }
  }

  return result;
};

export const generateFileMap = (
  rootPath: string,
  nodes: FileNode[],
  selectedFiles: Set<string>
): string => {
  const header = rootPath || "/";
  const tree = buildFileMapTree(nodes, "", selectedFiles).trimEnd();

  if (!tree) {
    return header;
  }

  return `${header}\n${tree}`;
};

export const collectAllDirectories = (nodes: FileNode[]): string[] => {
  const dirs: string[] = [];
  for (const node of nodes) {
    if (node.is_directory) {
      dirs.push(node.path);
      if (node.children) {
        dirs.push(...collectAllDirectories(node.children));
      }
    }
  }
  return dirs;
};
