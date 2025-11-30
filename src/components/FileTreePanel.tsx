import type { FileNode } from "../types";
import FileControls from "./FileControls";
import TreeNode from "./TreeNode";

interface FileTreePanelProps {
  fileTree: FileNode[];
  selectedFiles: Set<string>;
  expandedDirs: Set<string>;
  onToggleFile: (filePath: string) => void;
  onToggleDirectory: (dirPath: string) => void;
  onToggleDirectorySelection: (dirPath: string) => void;
  getDirectoryCheckboxState: (dirPath: string) => "checked" | "unchecked" | "indeterminate";
  onSelectAllFiles: () => void;
  onDeselectAllFiles: () => void;
  onExpandAllDirectories: () => void;
  onCollapseAllDirectories: () => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
}

function FileTreePanel({
  fileTree,
  selectedFiles,
  expandedDirs,
  onToggleFile,
  onToggleDirectory,
  onToggleDirectorySelection,
  getDirectoryCheckboxState,
  onSelectAllFiles,
  onDeselectAllFiles,
  onExpandAllDirectories,
  onCollapseAllDirectories,
  searchTerm,
  onSearchChange,
}: FileTreePanelProps) {
  return (
    <div className="file-tree-panel">
      <FileControls
        onSelectAll={onSelectAllFiles}
        onDeselectAll={onDeselectAllFiles}
        onExpandAll={onExpandAllDirectories}
        onCollapseAll={onCollapseAllDirectories}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />

      <div className="file-browser">
        {fileTree.length > 0 ? (
          fileTree.map((file) => (
            <TreeNode
              key={file.path}
              node={file}
              selectedFiles={selectedFiles}
              expandedDirs={expandedDirs}
              onToggleFile={onToggleFile}
              onToggleDirectory={onToggleDirectory}
              onToggleDirectorySelection={onToggleDirectorySelection}
              getDirectoryCheckboxState={getDirectoryCheckboxState}
              depth={0}
              searchTerm={searchTerm}
            />
          ))
        ) : (
          <div className="no-files-message">
            {searchTerm.trim()
              ? `No files or folders found for "${searchTerm.trim()}".`
              : "No files found in this folder."}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileTreePanel;
