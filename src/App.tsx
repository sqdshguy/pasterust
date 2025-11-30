import { useState, useCallback, useEffect } from "react";
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
import { TASK_TYPES } from "./data/taskTypes";

// Import custom hooks
import { useFileTree } from "./hooks/useFileTree";
import { useFileSelection } from "./hooks/useFileSelection";

// Import utilities
import { filterFileTree } from "./utils/searchUtils";
import { buildPromptPayload } from "./utils/promptBuilder";

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
    getSelectedFilesInfo,
  } = useFileSelection(fileTree);

  // Local state
  const defaultTaskType = TASK_TYPES.find((task) => task.id === "standard");
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(
    defaultTaskType?.id ?? null,
  );
  const [prompt, setPrompt] = useState<string>(defaultTaskType?.prompt ?? "");
  const [includeFileStructure, setIncludeFileStructure] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [, setSelectedLLM] = useState<string>("gpt-4");
  const [selectedFileContents, setSelectedFileContents] = useState<SelectedFile[]>([]);
  const [promptTokenCount, setPromptTokenCount] = useState<number>(0);
  const [isCountingTokens, setIsCountingTokens] = useState<boolean>(false);

  // Keep cached file contents in sync with selection
  useEffect(() => {
    const selectedPaths = new Set(selectedFiles);
    setSelectedFileContents((prev) => {
      const filtered = prev.filter((file) => selectedPaths.has(file.path));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [selectedFiles]);

  // Get filtered file tree
  const filteredFileTree = useCallback(() => {
    return filterFileTree(fileTree, searchTerm);
  }, [fileTree, searchTerm]);

  // Task type selection handler
  const handleTaskTypeSelect = useCallback(
    (taskType: TaskType | null) => {
      if (taskType) {
        setSelectedTaskType(taskType.id);
        setPrompt(taskType.prompt);
        return;
      }

      if (defaultTaskType) {
        setSelectedTaskType(defaultTaskType.id);
        setPrompt(defaultTaskType.prompt);
      } else {
        setSelectedTaskType(null);
        setPrompt("");
      }
    },
    [defaultTaskType],
  );

  // Prompt change handler that clears task type when manually edited
  const handlePromptChange = useCallback(
    (newPrompt: string) => {
      setPrompt(newPrompt);
      if (selectedTaskType && selectedTaskType !== "standard") {
        setSelectedTaskType(defaultTaskType?.id ?? null);
      }
    },
    [selectedTaskType, defaultTaskType],
  );

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

  const ensureSelectedFileContents = useCallback(async (): Promise<SelectedFile[]> => {
    if (selectedFiles.size === 0) {
      return [];
    }

    const selectedPaths = Array.from(selectedFiles);
    const existingMap = new Map(selectedFileContents.map((file) => [file.path, file]));
    const missingPaths = selectedPaths.filter((path) => !existingMap.has(path));

    if (missingPaths.length === 0) {
      return [...selectedFileContents].sort((a, b) => a.path.localeCompare(b.path));
    }

    const loadedFiles: SelectedFile[] = [];

    for (const filePath of missingPaths) {
      try {
        const content = await invoke<string>("read_file_content", { filePath });
        const fileName = filePath.split(/[/\\]/).pop() || filePath;
        loadedFiles.push({
          path: filePath,
          name: fileName,
          content
        });
      } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error);
        setMessage(`Failed to read file ${filePath}`);
      }
    }

    const combinedFiles = [...selectedFileContents, ...loadedFiles].filter((file) =>
      selectedFiles.has(file.path)
    );
    combinedFiles.sort((a, b) => a.path.localeCompare(b.path));
    setSelectedFileContents(combinedFiles);

    return combinedFiles;
  }, [selectedFiles, selectedFileContents, setMessage]);

  const buildPayloadWithFiles = useCallback((files: SelectedFile[]) => {
    if (selectedFiles.size === 0) {
      return "";
    }

    return buildPromptPayload({
      selectedFolder,
      fileTree,
      selectedFiles,
      includeFileStructure,
      prompt,
      filesWithContent: files
    });
  }, [selectedFolder, fileTree, selectedFiles, includeFileStructure, prompt]);

  // Recompute prompt token count for the full XML payload
  useEffect(() => {
    let isCancelled = false;

    if (selectedFiles.size === 0) {
      setPromptTokenCount(0);
      setIsCountingTokens(false);
      return;
    }

    setIsCountingTokens(true);

    const timeoutId = setTimeout(async () => {
      try {
        const filesWithContent = await ensureSelectedFileContents();
        if (isCancelled) return;

        const payload = buildPayloadWithFiles(filesWithContent);
        if (!payload.trim()) {
          setPromptTokenCount(0);
          return;
        }

        const tokenCount = await invoke<number>("count_prompt_tokens_command", { prompt: payload });
        if (!isCancelled) {
          setPromptTokenCount(tokenCount);
        }
      } catch (error) {
        console.error("Failed to count prompt tokens:", error);
        if (!isCancelled) {
          const fallbackPayload = buildPayloadWithFiles(selectedFileContents);
          setPromptTokenCount(Math.ceil(fallbackPayload.length / 4));
        }
      } finally {
        if (!isCancelled) {
          setIsCountingTokens(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    selectedFiles,
    prompt,
    includeFileStructure,
    fileTree,
    selectedFolder,
    ensureSelectedFileContents,
    buildPayloadWithFiles,
    selectedFileContents
  ]);

  // Clipboard functionality
  const copyToClipboard = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setMessage("Please select at least one file");
      return;
    }

    try {
      const filesWithContent = await ensureSelectedFileContents();

      if (filesWithContent.length === 0) {
        setMessage("No file contents available to copy");
        return;
      }

      const xmlOutput = buildPayloadWithFiles(filesWithContent);

      await invoke("copy_to_clipboard", { content: xmlOutput });
      setMessage(`Copied ${filesWithContent.length} files to clipboard!`);
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  }, [selectedFiles, ensureSelectedFileContents, buildPayloadWithFiles, setMessage]);

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
            promptTokenCount={promptTokenCount}
            isCountingTokens={isCountingTokens}
            selectedFilesCount={selectedFiles.size}
            onLLMChange={handleLLMChange}
          />
          <PromptPanel
            selectedFiles={selectedFiles}
            selectedFilesInfo={getSelectedFilesInfo()}
            prompt={prompt}
            isLoading={isLoading}
            message={message}
            includeFileStructure={includeFileStructure}
            promptTokenCount={promptTokenCount}
            isCountingTokens={isCountingTokens}
            onPromptChange={handlePromptChange}
            onToggleFile={toggleFileSelection}
            onCopyToClipboard={copyToClipboard}
            onIncludeFileStructureChange={setIncludeFileStructure}
          />
        </div>
      </div>
    </div>
  );
}

export default App; 
