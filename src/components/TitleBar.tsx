interface TitleBarProps {
  selectedFolder: string;
  scanTime: number | null;
  isLoading: boolean;
  onSelectFolder: () => void;
  onRefreshDirectory: () => void;
}

function TitleBar({ 
  selectedFolder, 
  scanTime, 
  isLoading, 
  onSelectFolder, 
  onRefreshDirectory 
}: TitleBarProps) {
  // Format scan time for display
  const formatScanTime = (timeMs: number): string => {
    if (timeMs < 1000) {
      return `${Math.round(timeMs)}ms`;
    } else {
      return `${(timeMs / 1000).toFixed(1)}s`;
    }
  };

  return (
    <header className="title-bar">
      <div className="title-content">
        <div className="title-left">
          <span className="app-icon">🦀</span>
          <h1 className="app-title">PasteRust</h1>
        </div>
        
        <div className="title-center">
          {selectedFolder ? (
            <div className="header-folder-info">
              <span className="folder-icon">📂</span>
              <span className="folder-path">{selectedFolder}</span>
              {scanTime && (
                <span className="scan-time">({formatScanTime(scanTime)})</span>
              )}
            </div>
          ) : (
            <span className="no-folder-text">No folder selected</span>
          )}
        </div>
        
        <div className="title-right">
          <div className="header-actions">
            {selectedFolder && (
              <button 
                onClick={onRefreshDirectory} 
                disabled={isLoading}
                className="header-refresh-btn"
                title="Refresh directory scan"
              >
                {isLoading ? "⏳" : "🔄"}
              </button>
            )}
            <button 
              onClick={onSelectFolder} 
              disabled={isLoading}
              className="header-select-folder-btn"
              title="Select folder"
            >
              {isLoading ? "⏳" : "📁"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TitleBar; 