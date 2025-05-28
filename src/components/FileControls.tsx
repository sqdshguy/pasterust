interface FileControlsProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
}

function FileControls({ 
  onSelectAll, 
  onDeselectAll, 
  onExpandAll, 
  onCollapseAll,
  searchTerm,
  onSearchChange
}: FileControlsProps) {
  return (
    <div className="file-controls">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            onClick={() => onSearchChange('')}
            className="clear-search-btn"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="control-actions">
        <div className="control-group">
          <button onClick={onSelectAll} className="control-btn">
            Select All
          </button>
          <button onClick={onDeselectAll} className="control-btn">
            Clear
          </button>
        </div>
        <div className="control-group">
          <button onClick={onExpandAll} className="control-btn">
            Expand
          </button>
          <button onClick={onCollapseAll} className="control-btn">
            Collapse
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileControls; 