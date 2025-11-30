import { useState, useEffect } from 'react';
import { FileNode } from '../types';

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
  
  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return isExpanded ? '📂' : '📁';
    }
    
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
  };

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

  return (
    <div className={getTreeNodeClasses()} style={{ marginLeft: `${depth * 20}px` }}>
      <div className="tree-node-header">
        {node.is_directory ? (
          <div className="directory-item">
            <input
              type="checkbox"
              className="directory-checkbox"
              checked={getDirectoryCheckboxState(node.path) === 'checked'}
              ref={(input) => {
                if (input) {
                  input.indeterminate = getDirectoryCheckboxState(node.path) === 'indeterminate';
                }
              }}
              onChange={() => onToggleDirectorySelection(node.path)}
            />
            <button 
              className={getExpandButtonClasses()}
              onClick={() => onToggleDirectory(node.path)}
              disabled={!hasChildren}
            >
              {hasChildren ? (isExpanded ? '▼' : '▶') : '·'}
            </button>
            <span className="file-icon">{getFileIcon(node.name, true)}</span>
            <span className="file-name">{node.name}</span>
            <span className="source-count">
              {countSourceFiles(node)} source files
            </span>
          </div>
        ) : (
          <label className="file-checkbox">
            <input
              type="checkbox"
              checked={selectedFiles.has(node.path)}
              onChange={() => onToggleFile(node.path)}
              disabled={!node.is_source_file}
            />
            <span className={`file-info ${!node.is_source_file ? 'non-source' : ''}`}>
              <span className="file-icon">{getFileIcon(node.name, false)}</span>
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
