import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { updateTaskStatus } from '../api/taskApi';

const statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

const KanbanBoard = ({ tasks }) => {
  const groupedTasks = statuses.reduce((acc, status) => {
    acc[status] = tasks?.filter(task => task.status === status) || [];
    return acc;
  }, {});
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const taskId = result.draggableId;
    const newStatus = destination.droppableId;
    try {
      await updateTaskStatus(taskId, newStatus);
      // Optionally, update local state or re-fetch tasks
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {statuses.map(status => (
        <Droppable key={status} droppableId={status}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{ margin: '10px' }}>
              <h2>{status}</h2>
              {groupedTasks[status].map((task, index) => (
                <Draggable key={task._id} draggableId={task._id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ padding: '10px', margin: '5px 0', border: '1px solid #ccc' }}>
                      {task.title}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </DragDropContext>
  );
};

export default KanbanBoard;