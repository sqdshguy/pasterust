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
import { SelectedFile, TaskType } from "./types";

// Import custom hooks
import { useFileTree } from "./hooks/useFileTree";
import { useFileSelection } from "./hooks/useFileSelection";

// Import utilities
import { filterFileTree } from "./utils/searchUtils";
import { generateFileTreeStructure } from "./utils/fileUtils";

function App() {
  // Use custom hooks for complex state management
  const {
    selectedFolder,
    fileTree,
    isLoading,
    message,
    scanTime,
    selectFolder,
    refreshDirectory,
    setMessage
  } = useFileTree();

  const {
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
    getSelectedTokenCount,
    getSelectedFilesInfo,
  } = useFileSelection(fileTree);

  // Local state
  const [prompt, setPrompt] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [includeFileStructure, setIncludeFileStructure] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [, setSelectedLLM] = useState<string>("gpt-4");

  // Get filtered file tree
  const filteredFileTree = useCallback(() => {
    return filterFileTree(fileTree, searchTerm);
  }, [fileTree, searchTerm]);

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
    if (selectedTaskType) {
      setSelectedTaskType(null);
    }
  }, [selectedTaskType]);

  // Search change handler
  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    
    if (newSearchTerm.trim()) {
      expandAllDirectories();
    }
  }, [expandAllDirectories]);

  // LLM selection handler
  const handleLLMChange = useCallback((llmId: string) => {
    setSelectedLLM(llmId);
  }, []);

  // Clipboard functionality
  const copyToClipboard = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setMessage("Please select at least one file");
      return;
    }

    try {
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
    }
  }, [selectedFiles, prompt, includeFileStructure, fileTree]);

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