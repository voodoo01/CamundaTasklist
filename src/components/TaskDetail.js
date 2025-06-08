import React from 'react';

function TaskDetail({ task }) {
  if (!task) {
    return <div>Select a task to see details</div>;
  }

  return (
    <div>
      <h2>{task.name}</h2>
      <p>ID: {task.id}</p>
      {/* Add more task details here */}
    </div>
  );
}

export default TaskDetail;
