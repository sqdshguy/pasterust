import type { FileNode } from "../types";

export const filterFileTree = (nodes: FileNode[], searchTerm: string): FileNode[] => {
  if (!searchTerm.trim()) return nodes;

  const lowercaseSearch = searchTerm.toLowerCase().trim();

  const filterNode = (node: FileNode): FileNode | null => {
    const matchesSearch =
      node.name.toLowerCase().includes(lowercaseSearch) ||
      node.path.toLowerCase().includes(lowercaseSearch);

    let filteredChildren: FileNode[] = [];
    if (node.children) {
      filteredChildren = node.children
        .map((child) => filterNode(child))
        .filter((child): child is FileNode => child !== null);
    }

    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      };
    }

    return null;
  };

  return nodes.map((node) => filterNode(node)).filter((node): node is FileNode => node !== null);
};
