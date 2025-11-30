import { useState, useCallback } from 'react';
import { FileNode, SelectedFileInfo, FileSelectionHookResult, DirectoryCheckboxState } from '../types';
import { 
  getNodeByPath, 
  getSourceFilesInDirectory, 
  getAllSourceFiles,
  getFileIcon 
} from '../utils/fileUtils';

export const useFileSelection = (fileTree: FileNode[]): FileSelectionHookResult => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleFileSelection = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const toggleDirectoryExpansion = useCallback((dirPath: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dirPath)) {
        newSet.delete(dirPath);
      } else {
        newSet.add(dirPath);
      }
      return newSet;
    });
  }, []);

  const getDirectoryCheckboxState = useCallback((dirPath: string): DirectoryCheckboxState => {
    const dirNode = getNodeByPath(fileTree, dirPath);
    if (!dirNode || !dirNode.is_directory) return 'unchecked';

    const sourceFilesInDir = getSourceFilesInDirectory(dirNode);
    if (sourceFilesInDir.length === 0) return 'unchecked';

    const selectedFilesInDir = sourceFilesInDir.filter(filePath => selectedFiles.has(filePath));

    if (selectedFilesInDir.length === 0) return 'unchecked';
    if (selectedFilesInDir.length === sourceFilesInDir.length) return 'checked';
    return 'indeterminate';
  }, [fileTree, selectedFiles]);

  const toggleDirectorySelection = useCallback((dirPath: string) => {
    const dirNode = getNodeByPath(fileTree, dirPath);
    if (!dirNode || !dirNode.is_directory) return;

    const sourceFilesInDir = getSourceFilesInDirectory(dirNode);
    const currentState = getDirectoryCheckboxState(dirPath);

    setSelectedFiles(prev => {
      const newSet = new Set(prev);

      if (currentState === 'checked') {
        sourceFilesInDir.forEach(filePath => newSet.delete(filePath));
      } else {
        sourceFilesInDir.forEach(filePath => newSet.add(filePath));
      }

      return newSet;
    });
  }, [fileTree, getDirectoryCheckboxState]);

  const selectAllFiles = useCallback(() => {
    const allSourceFiles = getAllSourceFiles(fileTree);
    setSelectedFiles(new Set(allSourceFiles));
  }, [fileTree]);

  const deselectAllFiles = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const expandAllDirectories = useCallback(() => {
    const collectAllDirs = (nodes: FileNode[]): string[] => {
      const dirs: string[] = [];
      for (const node of nodes) {
        if (node.is_directory) {
          dirs.push(node.path);
          if (node.children) {
            dirs.push(...collectAllDirs(node.children));
          }
        }
      }
      return dirs;
    };
    setExpandedDirs(new Set(collectAllDirs(fileTree)));
  }, [fileTree]);

  const collapseAllDirectories = useCallback(() => {
    setExpandedDirs(new Set());
  }, []);

  const getSelectedFilesInfo = useCallback((): SelectedFileInfo[] => {
    return Array.from(selectedFiles)
      .map(filePath => {
        const node = getNodeByPath(fileTree, filePath);
        if (!node) return null;

        return {
          path: filePath,
          name: node.name,
          tokenCount: node.token_count,
          icon: getFileIcon(node.name)
        } as SelectedFileInfo;
      })
      .filter((file): file is SelectedFileInfo => file !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedFiles, fileTree]);

  const resetSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setExpandedDirs(new Set());
  }, []);

  return {
    selectedFiles,
    expandedDirs,
    toggleFileSelection,
    toggleDirectoryExpansion,
    getDirectoryCheckboxState,
    toggleDirectorySelection,
    selectAllFiles,
    deselectAllFiles,
    expandAllDirectories,
    collapseAllDirectories,
    getSelectedFilesInfo,
    resetSelection
  };
};
