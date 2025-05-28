import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Import our modular components
import TitleBar from "./components/TitleBar";
import FileTreePanel from "./components/FileTreePanel";
import PromptPanel from "./components/PromptPanel";
import TaskTypePanel from "./components/TaskTypePanel";
import ContextUsagePanel from "./components/ContextUsagePanel";

// Import shared types
import { FileNode, SelectedFile, SelectedFileInfo, TaskType } from "./types";

function App() {
  // Core state management
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [includeFileStructure, setIncludeFileStructure] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [, setSelectedLLM] = useState<string>("gpt-4");

  // Utility function to find a node by path in the tree
  const getNodeByPath = useCallback((nodes: FileNode[], targetPath: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === targetPath) return node;
      if (node.children) {
        const found = getNodeByPath(node.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Filter file tree based on search term
  const filterFileTree = useCallback((nodes: FileNode[], searchTerm: string): FileNode[] => {
    if (!searchTerm.trim()) return nodes;

    const lowercaseSearch = searchTerm.toLowerCase().trim();
    
    const filterNode = (node: FileNode): FileNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(lowercaseSearch) ||
                          node.path.toLowerCase().includes(lowercaseSearch);
      
      let filteredChildren: FileNode[] = [];
      if (node.children) {
        filteredChildren = node.children
          .map(child => filterNode(child))
          .filter((child): child is FileNode => child !== null);
      }
      
      // Include node if it matches or has matching children
      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        };
      }
      
      return null;
    };

    return nodes
      .map(node => filterNode(node))
      .filter((node): node is FileNode => node !== null);
  }, []);

  // Get filtered file tree
  const filteredFileTree = useCallback(() => {
    return filterFileTree(fileTree, searchTerm);
  }, [fileTree, searchTerm, filterFileTree]);

  // Utility functions for counting files and tokens
  const countSourceFiles = useCallback((nodes: FileNode[]): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.is_source_file) count++;
      if (node.children) count += countSourceFiles(node.children);
    }
    return count;
  }, []);

  const countTotalTokens = useCallback((nodes: FileNode[]): number => {
    let total = 0;
    for (const node of nodes) {
      total += node.token_count || 0;
      if (node.children) total += countTotalTokens(node.children);
    }
    return total;
  }, []);

  // Folder selection and scanning
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
        setSelectedFiles(new Set());
        setExpandedDirs(new Set());

        const totalFiles = countSourceFiles(tree);
        const totalTokens = countTotalTokens(tree);
        setMessage(`Found ${totalFiles} source files with ${totalTokens.toLocaleString()} total tokens`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
      setScanTime(null);
    } finally {
      setIsLoading(false);
    }
  }, [countSourceFiles, countTotalTokens]);

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
      setSelectedFiles(new Set());
      setExpandedDirs(new Set());

      const totalFiles = countSourceFiles(tree);
      const totalTokens = countTotalTokens(tree);
      setMessage(`Refreshed: Found ${totalFiles} source files with ${totalTokens.toLocaleString()} total tokens`);
    } catch (error) {
      setMessage(`Error refreshing: ${error}`);
      setScanTime(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder, countSourceFiles, countTotalTokens]);

  // File selection handlers
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

  // Get all source files recursively
  const getAllSourceFiles = useCallback((nodes: FileNode[]): string[] => {
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
  }, []);

  // Get source files within a specific directory
  const getSourceFilesInDirectory = useCallback((node: FileNode): string[] => {
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
  }, []);

  // Directory checkbox state management
  const getDirectoryCheckboxState = useCallback((dirPath: string): 'checked' | 'unchecked' | 'indeterminate' => {
    const dirNode = getNodeByPath(fileTree, dirPath);
    if (!dirNode || !dirNode.is_directory) return 'unchecked';

    const sourceFilesInDir = getSourceFilesInDirectory(dirNode);
    if (sourceFilesInDir.length === 0) return 'unchecked';

    const selectedFilesInDir = sourceFilesInDir.filter(filePath => selectedFiles.has(filePath));

    if (selectedFilesInDir.length === 0) return 'unchecked';
    if (selectedFilesInDir.length === sourceFilesInDir.length) return 'checked';
    return 'indeterminate';
  }, [fileTree, selectedFiles, getNodeByPath, getSourceFilesInDirectory]);

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
  }, [fileTree, getNodeByPath, getSourceFilesInDirectory, getDirectoryCheckboxState]);

  // File operation handlers
  const selectAllFiles = useCallback(() => {
    const allSourceFiles = getAllSourceFiles(fileTree);
    setSelectedFiles(new Set(allSourceFiles));
  }, [fileTree, getAllSourceFiles]);

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

  // Token counting for selected files
  const getSelectedTokenCount = useCallback((): number => {
    let totalTokens = 0;
    for (const filePath of selectedFiles) {
      const node = getNodeByPath(fileTree, filePath);
      if (node && node.token_count) {
        totalTokens += node.token_count;
      }
    }
    return totalTokens;
  }, [selectedFiles, fileTree, getNodeByPath]);

  // File info utilities
  const getFileIcon = useCallback((fileName: string): string => {
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
  }, [selectedFiles, fileTree, getNodeByPath, getFileIcon]);

  // Task type selection handler
  const handleTaskTypeSelect = useCallback((taskType: TaskType | null) => {
    if (taskType) {
      setSelectedTaskType(taskType.id);
      setPrompt(taskType.prompt);
    } else {
      setSelectedTaskType(null);
      setPrompt("");
    }
  }, []);

  // Prompt change handler that clears task type when manually edited
  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
    // If the prompt is manually changed and doesn't match the selected task type, clear selection
    if (selectedTaskType) {
      setSelectedTaskType(null);
    }
  }, [selectedTaskType]);

  // Search change handler
  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    
    // Auto-expand directories when searching
    if (newSearchTerm.trim()) {
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
    }
  }, [fileTree]);

  // LLM selection handler
  const handleLLMChange = useCallback((llmId: string) => {
    setSelectedLLM(llmId);
  }, []);

  // Generate file tree structure as text
  const generateFileTreeStructure = useCallback((nodes: FileNode[], prefix: string = ""): string => {
    let result = "";
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isLast = i === nodes.length - 1;
      const currentPrefix = prefix + (isLast ? "└── " : "├── ");
      const nextPrefix = prefix + (isLast ? "    " : "│   ");
      
      // Add the current node
      if (node.is_directory) {
        result += `${currentPrefix}📁 ${node.name}/\n`;
        // Recursively add children if they exist
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
  }, [getFileIcon]);

  // Clipboard functionality
  const copyToClipboard = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setMessage("Please select at least one file");
      return;
    }

    try {
      setIsLoading(true);
      const selectedFilesArray = Array.from(selectedFiles);
      const fileContents: SelectedFile[] = [];

      for (const filePath of selectedFilesArray) {
        try {
          const content = await invoke<string>("read_file_content", { filePath });
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          fileContents.push({
            path: filePath,
            name: fileName,
            content
          });
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
        }
      }

      let xmlOutput = `<source_code_context>\n`;

      if (prompt.trim()) {
        xmlOutput += `  <user_prompt>\n${prompt.trim()}\n  </user_prompt>\n\n`;
      }

      if (includeFileStructure && fileTree.length > 0) {
        xmlOutput += `  <file_structure>\n`;
        xmlOutput += generateFileTreeStructure(fileTree);
        xmlOutput += `  </file_structure>\n\n`;
      }

      xmlOutput += `  <files>\n`;

      for (const file of fileContents) {
        xmlOutput += `    <file path="${file.path}" name="${file.name}">\n`;
        xmlOutput += `${file.content}\n`;
        xmlOutput += `    </file>\n\n`;
      }

      xmlOutput += `  </files>\n`;
      xmlOutput += `</source_code_context>`;

      await invoke("copy_to_clipboard", { content: xmlOutput });
      setMessage(`Copied ${fileContents.length} files to clipboard!`);
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFiles, prompt, includeFileStructure, fileTree, generateFileTreeStructure]);

  // Render the modular app
  return (
    <div className="app-window">
      <TitleBar
        selectedFolder={selectedFolder}
        scanTime={scanTime}
        isLoading={isLoading}
        onSelectFolder={selectFolder}
        onRefreshDirectory={refreshDirectory}
      />

      <div className="app-layout">
        <div className="left-panel">
          <TaskTypePanel
            selectedTaskType={selectedTaskType}
            onTaskTypeSelect={handleTaskTypeSelect}
          />
          <FileTreePanel
            fileTree={filteredFileTree()}
            selectedFiles={selectedFiles}
            expandedDirs={expandedDirs}
            onToggleFile={toggleFileSelection}
            onToggleDirectory={toggleDirectoryExpansion}
            onToggleDirectorySelection={toggleDirectorySelection}
            getDirectoryCheckboxState={getDirectoryCheckboxState}
            onSelectAllFiles={selectAllFiles}
            onDeselectAllFiles={deselectAllFiles}
            onExpandAllDirectories={expandAllDirectories}
            onCollapseAllDirectories={collapseAllDirectories}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
        </div>

        <div className="right-panel">
          <ContextUsagePanel
            prompt={prompt}
            selectedTokenCount={getSelectedTokenCount()}
            onLLMChange={handleLLMChange}
          />
          <PromptPanel
            selectedFiles={selectedFiles}
            selectedFilesInfo={getSelectedFilesInfo()}
            prompt={prompt}
            isLoading={isLoading}
            message={message}
            includeFileStructure={includeFileStructure}
            onPromptChange={handlePromptChange}
            onToggleFile={toggleFileSelection}
            onCopyToClipboard={copyToClipboard}
            onIncludeFileStructureChange={setIncludeFileStructure}
            getSelectedTokenCount={getSelectedTokenCount}
          />
        </div>
      </div>
    </div>
  );
}

export default App; 