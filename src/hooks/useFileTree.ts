import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileNode, FileTreeHookResult } from '../types';
import { countSourceFiles } from '../utils/fileUtils';

export const useFileTree = (): FileTreeHookResult => {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [scanTime, setScanTime] = useState<number | null>(null);

  const selectFolder = useCallback(async () => {
    try {
      setIsLoading(true);
      setScanTime(null);

      const folder = await invoke<string | null>("select_folder");
      if (folder) {
        setSelectedFolder(folder);
        const startTime = performance.now();
        const tree = await invoke<FileNode[]>("scan_directory", { folderPath: folder });

        const endTime = performance.now();
        const elapsed = endTime - startTime;
        setScanTime(elapsed);

        setFileTree(tree);

        const totalFiles = countSourceFiles(tree);
        setMessage(`Found ${totalFiles} source files`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
      setScanTime(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDirectory = useCallback(async () => {
    if (!selectedFolder) {
      setMessage("No folder selected to refresh");
      return;
    }

    try {
      setIsLoading(true);
      setScanTime(null);
      const startTime = performance.now();

      const tree = await invoke<FileNode[]>("scan_directory", { folderPath: selectedFolder });

      const endTime = performance.now();
      const elapsed = endTime - startTime;
      setScanTime(elapsed);

      setFileTree(tree);

      const totalFiles = countSourceFiles(tree);
      setMessage(`Refreshed: Found ${totalFiles} source files`);
    } catch (error) {
      setMessage(`Error refreshing: ${error}`);
      setScanTime(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder]);

  return {
    selectedFolder,
    fileTree,
    isLoading,
    message,
    scanTime,
    selectFolder,
    refreshDirectory,
    setFileTree,
    setMessage
  };
};
