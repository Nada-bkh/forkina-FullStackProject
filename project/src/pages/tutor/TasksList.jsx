import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KanbanBoard from '../../components/KanbanBoard.jsx';
import { fetchTasksByProject, createTask,deleteTask } from '../../api/taskApi.js';

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

const TasksList = ({ role }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assignedTo: '',
    dueDate: '',
    startDate: '',
    estimatedHours: '',
    actualHours: '',
    tags: '',
    projectRef: projectId,
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await fetchTasksByProject(projectId);
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: name === 'tags' ? value.split(',').map(tag => tag.trim()) : value,
    }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        startDate: newTask.startDate ? new Date(newTask.startDate) : undefined,
        estimatedHours: newTask.estimatedHours ? Number(newTask.estimatedHours) : undefined,
        actualHours: newTask.actualHours ? Number(newTask.actualHours) : undefined,
      };
      await createTask(taskData);
      setShowAddForm(false);
      setNewTask({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assignedTo: '',
        dueDate: '',
        startDate: '',
        estimatedHours: '',
        actualHours: '',
        tags: '',
        projectRef: projectId,
      });
      await fetchTasks();
    } catch (error) {
      setError(error.message || 'Failed to create task.');
    }
  };

  const handleDragEnd = async () => {
    await fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setError(null);
      await deleteTask(taskId);
      await fetchTasks();
    } catch (error) {
      setError(error.message || 'Failed to delete task.');
    }
  };

  const toDoCount = tasks.filter(task => task.status === 'TODO').length;
  const inProgressCount = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(task => task.status === 'COMPLETED').length;

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-gray-700">
          ← Back
        </button>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Project Tasks</h2>
          {role === 'ADMIN' && (
              <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                {showAddForm ? 'Cancel' : 'Add Task'}
              </button>
          )}
        </div>

        {showAddForm && role === 'ADMIN' && (
            <form onSubmit={handleAddTask} className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                      type="text"
                      name="title"
                      value={newTask.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                      required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                      name="description"
                      value={newTask.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                      name="status"
                      value={newTask.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  >
                    {Object.values(TaskStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  >
                    {Object.values(TaskPriority).map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To (User ID)</label>
                  <input
                      type="text"
                      name="assignedTo"
                      value={newTask.assignedTo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                      type="date"
                      name="startDate"
                      value={newTask.startDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                      type="date"
                      name="dueDate"
                      value={newTask.dueDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                  <input
                      type="number"
                      name="estimatedHours"
                      value={newTask.estimatedHours}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Hours</label>
                  <input
                      type="number"
                      name="actualHours"
                      value={newTask.actualHours}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input
                      type="text"
                      name="tags"
                      value={newTask.tags}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded p-2"
                      placeholder="e.g., tag1, tag2"
                  />
                </div>
              </div>
              <button
                  type="submit"
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Create Task
              </button>
            </form>
        )}

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Task Summary</h2>
          <div className="flex justify-between">
            <p><strong>To Do:</strong> {toDoCount}</p>
            <p><strong>In Progress:</strong> {inProgressCount}</p>
            <p><strong>Completed:</strong> {completedCount}</p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <KanbanBoard tasks={tasks} onDragEnd={handleDragEnd} onDeleteTask={handleDeleteTask} />
        </div>
      </div>
  );
};

export default TasksList;