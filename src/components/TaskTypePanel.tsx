import { TaskType } from '../types';
import { TASK_TYPES, TASK_CATEGORIES } from '../data/taskTypes';

interface TaskTypePanelProps {
  selectedTaskType: string | null;
  onTaskTypeSelect: (taskType: TaskType | null) => void;
}

function TaskTypePanel({ selectedTaskType, onTaskTypeSelect }: TaskTypePanelProps) {
  const groupedTaskTypes = TASK_TYPES.reduce((groups, taskType) => {
    if (!groups[taskType.category]) {
      groups[taskType.category] = [];
    }
    groups[taskType.category].push(taskType);
    return groups;
  }, {} as Record<string, TaskType[]>);

  const handleTaskTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === '') {
      onTaskTypeSelect(null);
    } else {
      const selectedTask = TASK_TYPES.find(task => task.id === value);
      if (selectedTask) {
        onTaskTypeSelect(selectedTask);
      }
    }
  };

  return (
    <div className="task-type-panel">
      <div className="panel-header">
        <h3>🎯 Task Types</h3>
      </div>

      <div className="task-type-selector">
        <select
          id="task-type-select"
          value={selectedTaskType || ''}
          onChange={handleTaskTypeChange}
          className="task-type-select"
        >
          <option value="">Select a task type...</option>
          {Object.entries(TASK_CATEGORIES).map(([categoryKey, category]) => {
            const tasksInCategory = groupedTaskTypes[categoryKey] || [];
            if (tasksInCategory.length === 0) return null;

            return (
              <optgroup key={categoryKey} label={`${category.icon} ${category.name}`}>
                {tasksInCategory.map((taskType) => (
                  <option key={taskType.id} value={taskType.id}>
                    {taskType.name} - {taskType.description}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
    </div>
  );
}

export default TaskTypePanel; 