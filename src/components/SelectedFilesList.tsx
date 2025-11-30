import { useState } from "react";
import type { SelectedFileInfo } from "../types";
import FileIcon from "./FileIcon";

interface SelectedFilesListProps {
  selectedFilesInfo: SelectedFileInfo[];
  onRemoveFile: (filePath: string) => void;
}

function SelectedFilesList({ selectedFilesInfo, onRemoveFile }: SelectedFilesListProps) {
  const [removingFiles, setRemovingFiles] = useState<Set<string>>(new Set());

  const handleRemoveFile = (filePath: string) => {
    setRemovingFiles((prev) => new Set(prev).add(filePath));

    // Wait for animation to complete before actually removing
    setTimeout(() => {
      onRemoveFile(filePath);
      setRemovingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    }, 300);
  };

  if (selectedFilesInfo.length === 0) {
    return null;
  }

  return (
    <div className="selected-files-section">
      <div className="selected-files-list">
        {selectedFilesInfo.map((file, index) => {
          const isRemoving = removingFiles.has(file.path);
          const staggerDelay = `${index * 0.05}s`;

          return (
            <div
              key={file.path}
              className={`selected-file-item ${isRemoving ? "removing" : ""} staggered`}
              style={{ "--stagger-delay": staggerDelay } as React.CSSProperties}
            >
              <div className="selected-file-info">
                <span className="selected-file-icon">
                  <FileIcon />
                </span>
                <span className="selected-file-name">{file.name}</span>
              </div>
              <button
                type="button"
                className="remove-file-btn"
                onClick={() => handleRemoveFile(file.path)}
                title={`Remove ${file.name}`}
                disabled={isRemoving}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SelectedFilesList;
