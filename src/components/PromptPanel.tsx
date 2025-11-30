import SelectedFilesList from "./SelectedFilesList";
import { SelectedFileInfo } from "../types";

interface PromptPanelProps {
  selectedFiles: Set<string>;
  selectedFilesInfo: SelectedFileInfo[];
  prompt: string;
  isLoading: boolean;
  message: string;
  includeFileStructure: boolean;
  promptTokenCount: number;
  isCountingTokens: boolean;
  onPromptChange: (prompt: string) => void;
  onToggleFile: (filePath: string) => void;
  onCopyToClipboard: () => void;
  onIncludeFileStructureChange: (include: boolean) => void;
}

function PromptPanel({
  selectedFiles,
  selectedFilesInfo,
  prompt,
  isLoading,
  message,
  includeFileStructure,
  promptTokenCount,
  isCountingTokens,
  onPromptChange,
  onToggleFile,
  onCopyToClipboard,
  onIncludeFileStructureChange,
}: PromptPanelProps) {
  return (
    <div className="prompt-panel">
      <div className="panel-header">
        <h3>Prompt & Actions</h3>
        <div className="selection-status">
          {selectedFiles.size} files selected •{" "}
          {isCountingTokens
            ? "Counting prompt tokens..."
            : `${promptTokenCount.toLocaleString()} prompt tokens`}
        </div>
      </div>

      <SelectedFilesList
        selectedFilesInfo={selectedFilesInfo}
        onRemoveFile={onToggleFile}
      />

      <div className="prompt-section">
        <label htmlFor="prompt-textarea" className="prompt-label">
          User Instructions (Optional):
        </label>
        <textarea
          id="prompt-textarea"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Enter your prompt or instructions for the LLM here..."
          className="prompt-textarea"
          rows={8}
        />
      </div>

      <div className="actions-section">
        <div className="copy-options">
          <label className="file-structure-checkbox">
            <span className="checkbox-wrapper">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={includeFileStructure}
                onChange={(e) => onIncludeFileStructureChange(e.target.checked)}
              />
              <span
                className={`checkbox-box ${includeFileStructure ? "checked" : "unchecked"}`}
                aria-hidden="true"
              />
            </span>
            <span className="checkbox-label">Include file structure tree</span>
          </label>
        </div>

        <button
          onClick={onCopyToClipboard}
          disabled={isLoading || selectedFiles.size === 0}
          className="copy-button"
        >
          {isLoading ? "Processing..." : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default PromptPanel;
