import { useState, useEffect } from 'react';
import { FileNode } from '../types';
import FileIcon from './FileIcon';

interface TreeNodeProps {
  node: FileNode;
  selectedFiles: Set<string>;
  expandedDirs: Set<string>;
  onToggleFile: (filePath: string) => void;
  onToggleDirectory: (dirPath: string) => void;
  onToggleDirectorySelection: (dirPath: string) => void;
  getDirectoryCheckboxState: (dirPath: string) => 'checked' | 'unchecked' | 'indeterminate';
  depth: number;
  searchTerm?: string;
}

function TreeNode({ 
  node, 
  selectedFiles, 
  expandedDirs, 
  onToggleFile, 
  onToggleDirectory, 
  onToggleDirectorySelection, 
  getDirectoryCheckboxState, 
  depth,
  searchTerm
}: TreeNodeProps) {
  const isExpanded = expandedDirs.has(node.path);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFiles.has(node.path);
  const directoryState = node.is_directory
    ? getDirectoryCheckboxState(node.path)
    : 'unchecked';
  
  // Check if this node matches the search term
  const isSearchMatch = searchTerm && searchTerm.trim() 
    ? node.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      node.path.toLowerCase().includes(searchTerm.toLowerCase().trim())
    : false;
  
  // Animation state management
  const [isNewlySelected, setIsNewlySelected] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [wasExpanded, setWasExpanded] = useState(isExpanded);

  // Track selection changes for animation
  useEffect(() => {
    if (isSelected && !selectedFiles.has(node.path)) {
      // File was just selected
      setIsNewlySelected(true);
      const timer = setTimeout(() => setIsNewlySelected(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isSelected, node.path, selectedFiles]);

  // Track expansion changes for animation
  useEffect(() => {
    if (isExpanded !== wasExpanded) {
      if (isExpanded) {
        setIsExpanding(true);
        const timer = setTimeout(() => setIsExpanding(false), 300);
        return () => clearTimeout(timer);
      } else {
        setIsCollapsing(true);
        const timer = setTimeout(() => setIsCollapsing(false), 300);
        return () => clearTimeout(timer);
      }
    }
    setWasExpanded(isExpanded);
  }, [isExpanded, wasExpanded]);
  // Count source files recursively
  const countSourceFiles = (node: FileNode): number => {
    let count = node.is_source_file ? 1 : 0;
    if (node.children) {
      for (const child of node.children) {
        count += countSourceFiles(child);
      }
    }
    return count;
  };

  // Generate CSS classes for animations
  const getTreeNodeClasses = () => {
    const classes = ['tree-node'];
    if (isSelected) classes.push('file-selected');
    if (isNewlySelected) classes.push('newly-selected');
    if (isSearchMatch) classes.push('search-match');
    return classes.join(' ');
  };

  const getExpandButtonClasses = () => {
    const classes = ['expand-button'];
    if (isExpanded) classes.push('expanded');
    return classes.join(' ');
  };

  const getTreeChildrenClasses = () => {
    const classes = ['tree-children'];
    if (isExpanding) classes.push('expanding');
    if (isCollapsing) classes.push('collapsing');
    return classes.join(' ');
  };

  const FolderIcon = ({ open }: { open: boolean }) => (
    <svg
      className="folder-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.5 6.75A1.75 1.75 0 0 1 5.25 5h4.27c.46 0 .9.18 1.22.5l1.36 1.36c.33.32.77.5 1.23.5h4.47A1.75 1.75 0 0 1 19.5 9.1l-.6 8.15A1.75 1.75 0 0 1 17.16 19H5.09a1.75 1.75 0 0 1-1.73-1.93z"
        fill={open ? 'var(--primary-color)' : 'currentColor'}
        fillOpacity={open ? 0.14 : 0.12}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 9.5h17"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );

  return (
    <div className={getTreeNodeClasses()} style={{ marginLeft: `${depth * 20}px` }}>
      <div className="tree-node-header">
        {node.is_directory ? (
          <div className="directory-item">
            <button 
              className={getExpandButtonClasses()}
              onClick={() => onToggleDirectory(node.path)}
              disabled={!hasChildren}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {hasChildren && (
                <svg
                  className="chevron-icon"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M7 5l6 5-6 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={directoryState === 'checked'}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = directoryState === 'indeterminate';
                  }
                }}
                onChange={() => onToggleDirectorySelection(node.path)}
              />
              <span
                className={`checkbox-box ${directoryState}`}
                aria-hidden="true"
              />
            </label>
            <span className="file-icon folder-icon">
              <FolderIcon open={isExpanded} />
            </span>
            <span className="file-name">{node.name}</span>
            <span className="source-count">
              {countSourceFiles(node)} source files
            </span>
          </div>
        ) : (
          <label className="file-checkbox">
            <span className="checkbox-wrapper">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={selectedFiles.has(node.path)}
                onChange={() => onToggleFile(node.path)}
                disabled={!node.is_source_file}
              />
              <span
                className={`checkbox-box ${selectedFiles.has(node.path) ? 'checked' : 'unchecked'}`}
                aria-hidden="true"
              />
            </span>
            <span className={`file-info ${!node.is_source_file ? 'non-source' : ''}`}>
              <span className="file-icon">
                <FileIcon />
              </span>
              <span className="file-name">{node.name}</span>
              {!node.is_source_file && <span className="non-source-label">(not a source file)</span>}
            </span>
          </label>
        )}
      </div>
      
      {node.is_directory && isExpanded && hasChildren && (
        <div className={getTreeChildrenClasses()}>
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedFiles={selectedFiles}
              expandedDirs={expandedDirs}
              onToggleFile={onToggleFile}
              onToggleDirectory={onToggleDirectory}
              onToggleDirectorySelection={onToggleDirectorySelection}
              getDirectoryCheckboxState={getDirectoryCheckboxState}
              depth={depth + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TreeNode;
export type { TreeNodeProps }; 
