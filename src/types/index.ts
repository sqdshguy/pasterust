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

export interface TaskType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'analysis' | 'refactor' | 'debug' | 'feature' | 'documentation';
}

export interface ContextUsage {
  promptTokens: number;
  fileTokens: number;
  totalTokens: number;
  selectedLLM: string;
  usagePercentage: number;
  contextLimit: number;
}