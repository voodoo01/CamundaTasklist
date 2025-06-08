// src/api/zeebeApi.js
import axios from 'axios';
import { authService } from '../auth/authService';

const getGraphQlEndpoint = () => {
  const config = authService.getConfig();
  if (!config || !config.clusterUrl) {
    console.error('Camunda cluster URL not configured. Please login first.');
    return null;
  }
  let baseUrl = config.clusterUrl;
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  return `${baseUrl}/graphql`;
};

const executeGraphQLQuery = async (query, variables) => {
  const endpoint = getGraphQlEndpoint();
  if (!endpoint) {
    return Promise.reject(new Error('GraphQL endpoint not available. Please configure Camunda URL.'));
  }

  const headers = {
    ...authService.getAuthHeaders(),
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(endpoint, { query, variables }, { headers });
    if (response.data.errors) {
      console.error('GraphQL Errors:', response.data.errors);
      throw new Error(response.data.errors.map(err => err.message).join(', '));
    }
    return response.data.data;
  } catch (error) {
    console.error('GraphQL request failed:', error.response ? error.response.data : error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
    }
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        authService.logout();
        window.location.href = '/login';
    }
    throw error;
  }
};

// --- Queries and Mutations ---
const GET_TASKS_QUERY = `
  query GetTasks($query: TaskQuery) {
    tasks(query: $query) {
      id
      name
      taskDefinitionId
      processName
      creationTime
      completionTime
      assignee
      taskState
      formKey
    }
  }
`;

const getTasks = (queryParams) => {
  const defaultQuery = { state: 'CREATED' };
  return executeGraphQLQuery(GET_TASKS_QUERY, { query: queryParams || defaultQuery });
};

const GET_TASK_QUERY = `
  query GetTask($taskId: String!) {
    task(id: $taskId) {
      id
      name
      taskDefinitionId
      processName
      creationTime
      completionTime
      assignee
      taskState
      formKey
      variables {
        name
        value
      }
    }
  }
`;

const getTask = (taskId) => {
  return executeGraphQLQuery(GET_TASK_QUERY, { taskId });
};

const GET_TASK_FORM_QUERY = `
  query GetTaskForm($taskId: String!) {
    task(id: $taskId) {
      id
      formKey
    }
  }
`;

const getTaskForm = async (taskId) => {
  const data = await executeGraphQLQuery(GET_TASK_FORM_QUERY, { taskId });
  if (data && data.task) {
    return { id: data.task.id, formKey: data.task.formKey };
  }
  throw new Error('Form key not found for task.');
};

const CLAIM_TASK_MUTATION = `
  mutation ClaimTask($taskId: String!, $assignee: String) {
    claimTask(taskId: $taskId, assignee: $assignee) {
      id
      assignee
      taskState
    }
  }
`;
const claimTask = (taskId, assignee) => {
  return executeGraphQLQuery(CLAIM_TASK_MUTATION, { taskId, assignee });
};

const UNCLAIM_TASK_MUTATION = `
  mutation UnclaimTask($taskId: String!) {
    unclaimTask(taskId: $taskId) {
      id
      assignee
      taskState
    }
  }
`;
const unclaimTask = (taskId) => {
  return executeGraphQLQuery(UNCLAIM_TASK_MUTATION, { taskId });
};

const COMPLETE_TASK_MUTATION = `
  mutation CompleteTask($taskId: String!, $variables: [VariableInput!]!) {
    completeTask(taskId: $taskId, variables: $variables) {
      id
      taskState
    }
  }
`;
const completeTask = (taskId, variables) => {
  const formattedVariables = Object.entries(variables).map(([name, value]) => ({
    name,
    value: typeof value === 'object' ? JSON.stringify(value) : value.toString(),
  }));
  return executeGraphQLQuery(COMPLETE_TASK_MUTATION, { taskId, variables: formattedVariables });
};

// --- Form Schema Simulation ---
const MOCK_FORM_SCHEMAS = {
  "camunda-forms:bpmn:simpleInvoiceForm": {
    title: "Simple Invoice Approval",
    description: "Please review and approve the invoice details.",
    elements: [
      { type: "text", name: "invoiceNumber", title: "Invoice Number", isRequired: true },
      { type: "text", name: "amount", inputType: "number", title: "Amount", isRequired: true },
      { type: "radiogroup", name: "approvalStatus", title: "Approval Status", isRequired: true, choices: ["Approved", "Rejected"] },
      { type: "comment", name: "comments", title: "Comments" }
    ]
  },
  "camunda-forms:bpmn:leaveRequestForm": {
    title: "Leave Request",
    elements: [
      { type: "text", name: "employeeName", title: "Employee Name", defaultValue: "John Doe", isRequired: true },
      { type: "datepicker", name: "startDate", title: "Start Date", isRequired: true, dateFormat: "yyyy-mm-dd" },
      { type: "datepicker", name: "endDate", title: "End Date", isRequired: true, dateFormat: "yyyy-mm-dd" },
      { type: "dropdown", name: "leaveType", title: "Type of Leave", isRequired: true, choices: ["Vacation", "Sick Leave", "Personal"] },
      { type: "comment", name: "reason", title: "Reason for Leave" }
    ]
  },
  "DEFAULT_FORM": {
    title: "Default Task Form",
    elements: [
      { type: "text", name: "taskId", title: "Task ID", readOnly: true },
      { type: "comment", name: "notes", title: "Notes for task completion" }
    ]
  }
};

const getFormSchemaByFormKey = async (formKey, taskId) => {
  console.log(`Simulating schema fetch for formKey: ${formKey}, taskId: ${taskId}`);
  await new Promise(resolve => setTimeout(resolve, 300));

  if (formKey && MOCK_FORM_SCHEMAS[formKey]) {
    if (formKey === "DEFAULT_FORM" && MOCK_FORM_SCHEMAS[formKey].elements[0].name === "taskId") {
        const schemaCopy = JSON.parse(JSON.stringify(MOCK_FORM_SCHEMAS[formKey]));
        schemaCopy.elements[0].defaultValue = taskId;
        return schemaCopy;
    }
    return MOCK_FORM_SCHEMAS[formKey];
  }
  const defaultSchemaCopy = JSON.parse(JSON.stringify(MOCK_FORM_SCHEMAS["DEFAULT_FORM"]));
  if (defaultSchemaCopy.elements[0].name === "taskId") {
      defaultSchemaCopy.elements[0].defaultValue = taskId;
  }
  console.warn(`No specific mock schema for formKey "${formKey}". Using default form.`);
  return defaultSchemaCopy;
};

export const zeebeApi = {
  getTasks,
  getTask,
  getTaskForm,
  getFormSchemaByFormKey, // New function
  claimTask,
  unclaimTask,
  completeTask,
  executeGraphQLQuery,
  getGraphQlEndpoint,
};
