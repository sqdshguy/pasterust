interface TitleBarProps {
  selectedFolder: string;
  scanTime: number | null;
  isLoading: boolean;
  onSelectFolder: () => void | Promise<void>;
  onRefreshDirectory: () => void | Promise<void>;
}

const FolderIcon = ({ open = false, className }: { open?: boolean; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M3.5 6.75A1.75 1.75 0 0 1 5.25 5h4.27c.46 0 .9.18 1.22.5l1.36 1.36c.33.32.77.5 1.23.5h4.47A1.75 1.75 0 0 1 19.5 9.1l-.6 8.15A1.75 1.75 0 0 1 17.16 19H5.09a1.75 1.75 0 0 1-1.73-1.93z"
      fill="currentColor"
      fillOpacity={open ? 0.16 : 0.12}
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

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M5 4v4h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12a7 7 0 0 1 12-4.9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M19 20v-4h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 12a7 7 0 0 1-12 4.9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeOpacity="0.2"
    />
    <path
      d="M21 12c0-4.97-4.03-9-9-9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

function TitleBar({
  selectedFolder,
  scanTime,
  isLoading,
  onSelectFolder,
  onRefreshDirectory,
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
              <FolderIcon className="header-folder-icon" open />
              <span className="folder-path">{selectedFolder}</span>
              {scanTime && <span className="scan-time">({formatScanTime(scanTime)})</span>}
            </div>
          ) : (
            <span className="no-folder-text">No folder selected</span>
          )}
        </div>

        <div className="title-right">
          <div className="header-actions">
            {selectedFolder && (
              <button
                type="button"
                onClick={onRefreshDirectory}
                disabled={isLoading}
                className="header-refresh-btn"
                title="Refresh directory scan"
                aria-label="Refresh directory"
              >
                {isLoading ? (
                  <SpinnerIcon className="header-spinner" />
                ) : (
                  <RefreshIcon className="header-action-icon" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onSelectFolder}
              disabled={isLoading}
              className="header-select-folder-btn"
              title="Select folder"
              aria-label="Select folder"
            >
              {isLoading ? (
                <SpinnerIcon className="header-spinner" />
              ) : (
                <FolderIcon className="header-action-icon" open />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TitleBar;
