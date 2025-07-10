export interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileNode[];
  is_source_file: boolean;
  token_count?: number;
}

export interface SelectedFile {
  path: string;
  name: string;
  content?: string;
}

export interface SelectedFileInfo {
  path: string;
  name: string;
  tokenCount?: number;
  icon: string;
}

export type TaskCategory = 'analysis' | 'refactor' | 'debug' | 'feature' | 'documentation';

export interface TaskType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: TaskCategory;
}

export interface ContextUsage {
  promptTokens: number;
  fileTokens: number;
  totalTokens: number;
  selectedLLM: string;
  usagePercentage: number;
  contextLimit: number;
}

export interface DirectoryStats {
  totalFiles: number;
  sourceFiles: number;
  totalTokens: number;
  scanTime: number;
}

export interface SearchResult {
  query: string;
  matchCount: number;
  filteredTree: FileNode[];
}

export interface FileOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface AppSettings {
  defaultLLM: string;
  maxFileSize: number;
  includeBinaryFiles: boolean;
  autoExpandOnSearch: boolean;
}

export interface ClipboardContent {
  prompt?: string;
  files: SelectedFile[];
  includeFileStructure: boolean;
  fileStructure?: string;
}

export type DirectoryCheckboxState = 'checked' | 'unchecked' | 'indeterminate';

export interface FileTreeHookResult {
  selectedFolder: string;
  fileTree: FileNode[];
  isLoading: boolean;
  message: string;
  scanTime: number | null;
  selectFolder: () => Promise<void>;
  refreshDirectory: () => Promise<void>;
  setFileTree: (fileTree: FileNode[]) => void;
  setMessage: (message: string) => void;
}

export interface FileSelectionHookResult {
  selectedFiles: Set<string>;
  expandedDirs: Set<string>;
  toggleFileSelection: (filePath: string) => void;
  toggleDirectoryExpansion: (dirPath: string) => void;
  getDirectoryCheckboxState: (dirPath: string) => DirectoryCheckboxState;
  toggleDirectorySelection: (dirPath: string) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  expandAllDirectories: () => void;
  collapseAllDirectories: () => void;
  getSelectedTokenCount: () => number;
  getSelectedFilesInfo: () => SelectedFileInfo[];
  resetSelection: () => void;
}