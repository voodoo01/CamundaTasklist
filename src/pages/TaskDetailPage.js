// src/pages/TaskDetailPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zeebeApi } from '../api/zeebeApi';
import { authService } from '../auth/authService';
import DynamicForm from '../components/DynamicForm';
import { useNotification } from '../context/NotificationContext'; // Import

function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification(); // Use the hook

  const [task, setTask] = useState(null);
  const [formInfo, setFormInfo] = useState(null);
  const [formSchema, setFormSchema] = useState(null);
  const [loading, setLoading] = useState(true); // Page level loading
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});

  // Button specific loading states
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUnclaiming, setIsUnclaiming] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);


  const getCurrentUserId = useCallback(() => {
    const config = authService.getConfig();
    return config ? config.clientId : 'currentUser';
  }, []);

  const fetchTaskAndFormDetails = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    setFormSchema(null);

    try {
      const taskDetailsData = await zeebeApi.getTask(taskId);
      const currentTask = taskDetailsData.task;
      setTask(currentTask);

      if (currentTask) {
        const taskFormInfo = await zeebeApi.getTaskForm(taskId);
        setFormInfo(taskFormInfo);
        const schema = await zeebeApi.getFormSchemaByFormKey(taskFormInfo ? taskFormInfo.formKey : null, taskId);
        setFormSchema(schema);
      } else {
        setError("Task data could not be loaded.");
        addNotification("Task data could not be loaded.", "error");
      }

    } catch (err) {
      console.error(`Failed to fetch task/form details for ${taskId}:`, err);
      const errorMessage = err.message || `Failed to fetch task/form details.`;
      setError(errorMessage);
      addNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [taskId, addNotification]); // Added addNotification to dependency array

  useEffect(() => {
    fetchTaskAndFormDetails();
  }, [fetchTaskAndFormDetails]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await zeebeApi.claimTask(taskId);
      setTask(prev => prev ? { ...prev, assignee: getCurrentUserId(), taskState: 'CREATED' } : null);
      addNotification('Task claimed successfully!', 'success');
    } catch (err) {
      addNotification(`Failed to claim task: ${err.message}`, 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUnclaim = async () => {
    setIsUnclaiming(true);
    try {
      await zeebeApi.unclaimTask(taskId);
      setTask(prev => prev ? { ...prev, assignee: null, taskState: 'CREATED' } : null);
      addNotification('Task unclaimed successfully!', 'success');
    } catch (err) {
      addNotification(`Failed to unclaim task: ${err.message}`, 'error');
    } finally {
      setIsUnclaiming(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    const variablesToSubmit = (formSchema && Object.keys(formData).length > 0) ? formData : {};
    try {
      await zeebeApi.completeTask(taskId, variablesToSubmit);
      addNotification('Task completed successfully!', 'success');
      navigate('/');
    } catch (err) {
      addNotification(`Failed to complete task: ${err.message}`, 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  const onFormSubmit = (data) => {
    setFormData(data);
    addNotification('Form data captured. Ready to complete.', 'info');
    console.log('Form data submitted to TaskDetailPage:', data);
  };

  if (loading) return <div className="container mx-auto p-4 text-center">Loading task details and form...</div>;
  if (error && !task && !formSchema) return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>; // Show error if task and schema failed
  if (!task && !loading) return <div className="container mx-auto p-4 text-center">Task not found or failed to load.</div>;


  // Task might be loaded even if form schema had an error, so render task details if available
  const isAssignedToCurrentUser = task && task.assignee === getCurrentUserId();
  const canClaim = task && !task.assignee && task.taskState === 'CREATED';
  const canUnclaim = task && isAssignedToCurrentUser && task.taskState === 'CREATED';
  const canComplete = task && task.assignee && task.taskState === 'CREATED';

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-indigo-600 hover:text-indigo-800">
        &larr; Back to Task List
      </button>
      {task && ( // Only render task details if task object exists
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h1 className="text-3xl font-bold mb-2">{task.name || 'Unnamed Task'}</h1>
        <p className="text-sm text-gray-500 mb-4">ID: {task.id}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div><p className="text-sm font-semibold text-gray-600">Process Name:</p><p>{task.processName || 'N/A'}</p></div>
          <div><p className="text-sm font-semibold text-gray-600">Task Definition ID:</p><p>{task.taskDefinitionId || 'N/A'}</p></div>
          <div><p className="text-sm font-semibold text-gray-600">Assignee:</p><p>{task.assignee || 'Unassigned'}</p></div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Status:</p>
            <p>
                 <span className={`py-1 px-3 rounded-full text-xs ${
                        task.taskState === 'CREATED' && task.assignee ? 'bg-blue-200 text-blue-700' :
                        task.taskState === 'CREATED' && !task.assignee ? 'bg-yellow-200 text-yellow-700' :
                        task.taskState === 'COMPLETED' ? 'bg-green-200 text-green-700' :
                        task.taskState === 'CANCELED' ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-700'
                      }`}>
                {task.assignee && task.taskState === 'CREATED' ? 'Claimed' : task.taskState}
              </span>
            </p>
          </div>
          <div><p className="text-sm font-semibold text-gray-600">Created:</p><p>{task.creationTime ? new Date(task.creationTime).toLocaleString() : 'N/A'}</p></div>
          {task.completionTime && <div><p className="text-sm font-semibold text-gray-600">Completed:</p><p>{new Date(task.completionTime).toLocaleString()}</p></div>}
        </div>

        {error && !formSchema && <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">Error loading form: {error}. Default form might be shown if available.</div>}

        {formSchema ? (
          <div className="my-6 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">
              {formSchema.title || 'Task Form'}
              {formInfo && formInfo.formKey && <span className="text-sm text-gray-500 ml-2">({formInfo.formKey})</span>}
            </h2>
            <DynamicForm
              formSchema={formSchema}
              onSubmit={onFormSubmit}
            />
          </div>
        ) : (
          <div className="my-6 p-4 border rounded bg-gray-50 text-center text-gray-500">
            <p>{loading ? 'Loading form...' : 'No form schema loaded or form not applicable.'}</p>
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          {canClaim && (
            <button onClick={handleClaim} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50" disabled={isClaiming}>
              {isClaiming ? 'Claiming...' : 'Claim'}
            </button>
          )}
          {canUnclaim && (
            <button onClick={handleUnclaim} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50" disabled={isUnclaiming}>
              {isUnclaiming ? 'Unclaiming...' : 'Unclaim'}
            </button>
          )}
          <button
            onClick={handleComplete}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            disabled={!canComplete || (formSchema && formSchema.elements && formSchema.elements.length > 0 && Object.keys(formData).length === 0) || isCompleting }
          >
            {isCompleting ? 'Completing...' : 'Complete Task'}
          </button>
        </div>

        {task.variables && task.variables.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Task Variables</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(task.variables, null, 2)}
            </pre>
          </div>
        )}
      </div>
      )} {/* End of task conditional rendering */}
      {!task && !loading && error && /* General error if task itself failed to load */
        <div className="p-4 my-4 text-lg text-red-700 bg-red-100 rounded-lg text-center" role="alert">
            Failed to load task details: {error}. Please try again or go back to the task list.
        </div>
      }
    </div>
  );
}

export default TaskDetailPage;
