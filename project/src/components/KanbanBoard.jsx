import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { updateTaskStatus } from '../api/taskApi';
import { useState } from 'react';

const statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

const KanbanBoard = ({ tasks, onDragEnd, onDeleteTask = () => console.warn('onDeleteTask not provided') }) => {
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const groupedTasks = statuses.reduce((acc, status) => {
    acc[status] = tasks?.filter(task => task.status === status) || [];
    return acc;
  }, {});

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = result.draggableId;
    const newStatus = destination.droppableId;
    try {
      await updateTaskStatus(taskId, newStatus);
      if (onDragEnd) await onDragEnd();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteError(null); // Reset error state when opening the popup
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      if (typeof onDeleteTask !== 'function') {
        throw new Error('onDeleteTask is not a function');
      }
      await onDeleteTask(taskToDelete._id);
      setTaskToDelete(null);
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
    setDeleteError(null);
  };

  return (
      <>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto">
            {statuses.map(status => (
                <Droppable key={status} droppableId={status}>
                  {(provided) => (
                      <div
                          className="bg-gray-100 rounded-lg p-4 min-w-[300px] max-w-[300px] h-fit"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                      >
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                          {status.replace('_', ' ')} ({groupedTasks[status].length})
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                          {groupedTasks[status].map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow relative"
                                    >
                                      <h3 className="text-md font-medium text-gray-900">{task.title}</h3>
                                      {task.description && (
                                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                      )}
                                      <div className="mt-2 flex space-x-2">
                              <span
                                  className={`text-xs font-semibold px-2 py-1 rounded ${
                                      task.status === 'COMPLETED'
                                          ? 'bg-green-100 text-green-800'
                                          : task.status === 'IN_PROGRESS'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {task.status.replace('_', ' ')}
                              </span>
                                        <span
                                            className={`text-xs font-semibold px-2 py-1 rounded ${
                                                task.priority === 'URGENT'
                                                    ? 'bg-red-100 text-red-800'
                                                    : task.priority === 'HIGH'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : task.priority === 'MEDIUM'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                {task.priority}
                              </span>
                                      </div>
                                      {task.dueDate && (
                                          <p className="text-xs text-gray-500 mt-2">
                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                          </p>
                                      )}
                                      <button
                                          onClick={() => handleDeleteClick(task)}
                                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                )}
                              </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                  )}
                </Droppable>
            ))}
          </div>
        </DragDropContext>

        {taskToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete the task "{taskToDelete.title}"? This action cannot be undone.
                </p>
                {deleteError && (
                    <p className="text-red-500 mb-4">{deleteError}</p>
                )}
                <div className="flex justify-end space-x-4">
                  <button
                      onClick={cancelDelete}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={confirmDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  );
};

export default KanbanBoard;