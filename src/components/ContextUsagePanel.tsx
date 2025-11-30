import { useState, useMemo } from "react";
import { LLM_MODELS, LLM_CATEGORIES, getModelById } from "../data/llmModels";
import { ContextUsage } from "../types";

interface ContextUsagePanelProps {
  promptTokenCount: number;
  isCountingTokens: boolean;
  selectedFilesCount: number;
  onLLMChange?: (llmId: string) => void;
}

function ContextUsagePanel({
  promptTokenCount,
  isCountingTokens,
  selectedFilesCount,
  onLLMChange,
}: ContextUsagePanelProps) {
  const [selectedLLM, setSelectedLLM] = useState<string>("gpt-4");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Calculate context usage
  const contextUsage = useMemo((): ContextUsage => {
    const model = getModelById(selectedLLM);
    const contextLimit = model?.contextLimit || 128000;
    const totalTokens = promptTokenCount;
    const usagePercentage = (totalTokens / contextLimit) * 100;

    return {
      promptTokens: promptTokenCount,
      totalTokens,
      selectedLLM,
      usagePercentage,
      contextLimit,
    };
  }, [promptTokenCount, selectedLLM]);

  const handleLLMChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLLM = event.target.value;
    setSelectedLLM(newLLM);
    onLLMChange?.(newLLM);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 70) return "var(--success-color)";
    if (percentage < 90) return "#f59e0b"; // amber
    return "var(--error-color)";
  };

  const getUsageColorClass = (percentage: number): string => {
    if (percentage < 70) return "usage-safe";
    if (percentage < 90) return "usage-warning";
    return "usage-danger";
  };

  return (
    <div className="context-usage-panel">
      <div className="panel-header">
        <h3
          onClick={() => setIsExpanded(!isExpanded)}
          className="expandable-header"
        >
          Context Usage
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
            ▼
          </span>
        </h3>
        <div
          className={`usage-badge ${getUsageColorClass(contextUsage.usagePercentage)}`}
        >
          {contextUsage.totalTokens.toLocaleString()}/
          {(contextUsage.contextLimit / 1000).toFixed(0)}k (
          {contextUsage.usagePercentage.toFixed(1)}%)
        </div>
      </div>

      {isExpanded && (
        <div className="context-usage-content">
          <div className="llm-selector">
            <label htmlFor="llm-select" className="llm-label">
              LLM Model:
            </label>
            <select
              id="llm-select"
              value={selectedLLM}
              onChange={handleLLMChange}
              className="llm-select"
            >
              {Object.entries(LLM_CATEGORIES).map(([categoryKey, category]) => {
                const modelsInCategory = LLM_MODELS.filter(
                  (model) => model.category === categoryKey,
                );
                if (modelsInCategory.length === 0) return null;

                return (
                  <optgroup key={categoryKey} label={category.name}>
                    {modelsInCategory.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.icon} {model.name} (
                        {(model.contextLimit / 1000).toFixed(0)}k tokens)
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="usage-breakdown">
            <div className="usage-summary">
              <div className="usage-numbers">
                <span className="current-usage">
                  {contextUsage.totalTokens.toLocaleString()}
                </span>
                <span className="usage-separator">/</span>
                <span className="context-limit">
                  {contextUsage.contextLimit.toLocaleString()}
                </span>
                <span className="usage-unit">tokens</span>
              </div>
              <div className="usage-percentage">
                ({contextUsage.usagePercentage.toFixed(1)}%)
              </div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(contextUsage.usagePercentage, 100)}%`,
                    backgroundColor: getUsageColor(
                      contextUsage.usagePercentage,
                    ),
                  }}
                />
              </div>
            </div>

            <div className="token-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-icon">🧾</span>
                <span className="breakdown-label">Prompt payload:</span>
                <span className="breakdown-value">
                  {isCountingTokens ? (
                    <span className="counting-tokens">Counting...</span>
                  ) : (
                    `${contextUsage.promptTokens.toLocaleString()} tokens`
                  )}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-icon">📁</span>
                <span className="breakdown-label">Files included:</span>
                <span className="breakdown-value">{selectedFilesCount}</span>
              </div>
            </div>

            {contextUsage.usagePercentage > 90 && (
              <div className="usage-warning-message">
                ⚠️ Approaching context limit! Consider reducing file selection
                or prompt length.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextUsagePanel;
