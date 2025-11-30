import { useEffect, useRef, useState } from "react";
import { TaskType } from "../types";
import { TASK_TYPES } from "../data/taskTypes";

interface TaskTypePanelProps {
  selectedTaskType: string | null;
  onTaskTypeSelect: (taskType: TaskType | null) => void;
}

function TaskTypePanel({
  selectedTaskType,
  onTaskTypeSelect,
}: TaskTypePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedMode =
    TASK_TYPES.find((task) => task.id === selectedTaskType) ??
    TASK_TYPES.find((task) => task.id === "standard") ??
    TASK_TYPES[0];

  const handleSelect = (taskType: TaskType) => {
    onTaskTypeSelect(taskType);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="task-type-panel" ref={panelRef}>
      <div className="task-type-toggle">
        <div className="task-type-summary">
          <div className="task-type-label">Mode</div>
          <div className="task-type-current">
            {selectedMode?.name ?? "Standard"}
            {selectedMode?.id === "standard" ? (
              <span className="task-type-badge">Default</span>
            ) : null}
          </div>
          <div className="task-type-current-description">
            {selectedMode?.description}
          </div>
        </div>
        <button
          type="button"
          className="task-type-open-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {isOpen ? "Close" : "Change"}
        </button>
      </div>

      {isOpen ? (
        <div className="task-type-popover" role="menu">
          <div className="task-types-grid">
            {TASK_TYPES.map((taskType) => {
              const isSelected = selectedMode?.id === taskType.id;
              const isDefault = taskType.id === "standard";

              return (
                <button
                  key={taskType.id}
                  type="button"
                  className={`task-type-button${isSelected ? " selected" : ""}`}
                  onClick={() => handleSelect(taskType)}
                  aria-pressed={isSelected}
                  role="menuitemradio"
                >
                  <div className="task-type-name">
                    {taskType.name}
                    {isDefault ? (
                      <span className="task-type-badge">Default</span>
                    ) : null}
                  </div>
                  <div className="task-type-description">
                    {taskType.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TaskTypePanel;
