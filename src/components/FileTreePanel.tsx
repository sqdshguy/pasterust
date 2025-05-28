import FileControls from './FileControls';
import TreeNode from './TreeNode';
import { FileNode } from '../types';
import { useMemo } from 'react';

interface FileTreePanelProps {
  fileTree: FileNode[];
  selectedFiles: Set<string>;
  expandedDirs: Set<string>;
  onToggleFile: (filePath: string) => void;
  onToggleDirectory: (dirPath: string) => void;
  onToggleDirectorySelection: (dirPath: string) => void;
  getDirectoryCheckboxState: (dirPath: string) => 'checked' | 'unchecked' | 'indeterminate';
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
  onSearchChange
}: FileTreePanelProps) {
  // Count search results
  const searchResultsCount = useMemo(() => {
    if (!searchTerm.trim()) return null;
    
    const countMatches = (nodes: FileNode[]): number => {
      let count = 0;
      for (const node of nodes) {
        const matches = node.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                       node.path.toLowerCase().includes(searchTerm.toLowerCase().trim());
        if (matches) count++;
        if (node.children) {
          count += countMatches(node.children);
        }
      }
      return count;
    };
    
    return countMatches(fileTree);
  }, [fileTree, searchTerm]);

  return (
    <div className="file-tree-panel">
      <div className="panel-header">
        <h3>📁 Source Files</h3>
        {searchResultsCount !== null && (
          <div className="search-results-badge">
            {searchResultsCount} match{searchResultsCount !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

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
              : 'No files found in this folder.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileTreePanel; 