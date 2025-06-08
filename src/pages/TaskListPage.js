// src/pages/TaskListPage.js
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { Link, useNavigate } from 'react-router-dom';
import { zeebeApi } from '../api/zeebeApi';
import { authService } from '../auth/authService';
import { useNotification } from '../context/NotificationContext'; // Import

function TaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addNotification } = useNotification(); // Use the hook
  const [actionLoading, setActionLoading] = useState({}); // For button loading state e.g. { 'claim-1': true }


  const getCurrentUserId = useCallback(()  => {
    const config = authService.getConfig();
    return config ? config.clientId : 'currentUser';
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await zeebeApi.getTasks({ state: 'CREATED' });
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err.message || 'Failed to fetch tasks. Please ensure you are logged in and the API is reachable.');
      // No notification here, error is displayed inline
    } finally {
      setLoading(false);
    }
  }, []); // Removed addNotification from dependencies as it's stable

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleClaim = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [`claim-${taskId}`]: true }));
    try {
      await zeebeApi.claimTask(taskId);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, assignee: getCurrentUserId(), taskState: 'CREATED' } : task
        )
      );
      addNotification('Task claimed successfully!', 'success');
    } catch (err) {
      console.error('Failed to claim task:', err);
      addNotification(`Failed to claim task: ${err.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`claim-${taskId}`]: false }));
    }
  };

  const handleUnclaim = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [`unclaim-${taskId}`]: true }));
    try {
      await zeebeApi.unclaimTask(taskId);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, assignee: null, taskState: 'CREATED' } : task
        )
      );
      addNotification('Task unclaimed successfully!', 'success');
    } catch (err) {
      console.error('Failed to unclaim task:', err);
      addNotification(`Failed to unclaim task: ${err.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`unclaim-${taskId}`]: false }));
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading tasks...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Available Tasks</h1>
        <button
          onClick={fetchTasks}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Tasks'}
        </button>
      </div>
      {tasks.length === 0 && !loading && (
        <p className="text-center text-gray-500">No tasks found.</p>
      )}
      {tasks.length > 0 && (
        <div className="bg-white shadow-md rounded my-6 overflow-x-auto">
          <table className="min-w-max w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Process Name</th>
                <th className="py-3 px-6 text-center">Assignee</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-left">Created</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    <Link to={`/task/${task.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                      {task.name || 'N/A'}
                    </Link>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span>{task.processName || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span>{task.assignee || 'Unassigned'}</span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span
                      className={`py-1 px-3 rounded-full text-xs ${
                        task.taskState === 'CREATED' && task.assignee ? 'bg-blue-200 text-blue-700' :
                        task.taskState === 'CREATED' && !task.assignee ? 'bg-yellow-200 text-yellow-700' :
                        task.taskState === 'COMPLETED' ? 'bg-green-200 text-green-700' :
                        task.taskState === 'CANCELED' ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {task.assignee && task.taskState === 'CREATED' ? 'Claimed' : task.taskState}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span>{task.creationTime ? new Date(task.creationTime).toLocaleString() : 'N/A'}</span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button
                        onClick={() => navigate(`/task/${task.id}`)}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded shadow"
                        title="View Details"
                      >
                        View
                      </button>
                      {!task.assignee && task.taskState === 'CREATED' && (
                        <button
                          onClick={() => handleClaim(task.id)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded shadow disabled:opacity-50"
                          title="Claim Task"
                          disabled={actionLoading[`claim-${task.id}`]}
                        >
                          {actionLoading[`claim-${task.id}`] ? '...' : 'Claim'}
                        </button>
                      )}
                      {task.assignee === getCurrentUserId() && task.taskState === 'CREATED' && (
                        <button
                          onClick={() => handleUnclaim(task.id)}
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded shadow disabled:opacity-50"
                          title="Unclaim Task"
                          disabled={actionLoading[`unclaim-${task.id}`]}
                        >
                          {actionLoading[`unclaim-${task.id}`] ? '...' : 'Unclaim'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TaskListPage;
