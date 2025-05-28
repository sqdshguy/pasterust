import SelectedFilesList from './SelectedFilesList';
import { SelectedFileInfo } from '../types';

interface PromptPanelProps {
  selectedFiles: Set<string>;
  selectedFilesInfo: SelectedFileInfo[];
  prompt: string;
  isLoading: boolean;
  message: string;
  includeFileStructure: boolean;
  onPromptChange: (prompt: string) => void;
  onToggleFile: (filePath: string) => void;
  onCopyToClipboard: () => void;
  onIncludeFileStructureChange: (include: boolean) => void;
  getSelectedTokenCount: () => number;
}

function PromptPanel({
  selectedFiles,
  selectedFilesInfo,
  prompt,
  isLoading,
  message,
  includeFileStructure,
  onPromptChange,
  onToggleFile,
  onCopyToClipboard,
  onIncludeFileStructureChange,
  getSelectedTokenCount
}: PromptPanelProps) {
  return (
    <div className="prompt-panel">
      <div className="panel-header">
        <h3>✏️ Prompt & Actions</h3>
        <div className="selection-status">
          {selectedFiles.size} files selected ({getSelectedTokenCount().toLocaleString()} tokens)
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
            <input
              type="checkbox"
              checked={includeFileStructure}
              onChange={(e) => onIncludeFileStructureChange(e.target.checked)}
            />
            <span className="checkbox-label">Include file structure tree</span>
          </label>
        </div>
        
        <button 
          onClick={onCopyToClipboard}
          disabled={isLoading || selectedFiles.size === 0}
          className="copy-button"
        >
          {isLoading ? "Processing..." : `📋 Copy ${selectedFiles.size} Files`}
        </button>

        {message && (
          <div className={`status-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptPanel; 