import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, ApiResponse, ApiTaskPayload, TaskStatus, TaskType, TaskPriority } from '../types';
import { useAuditStore } from '../stores/useAuditStore';
import { useTaskStore } from '../stores/useTaskStore';
import { apiClient } from './apiClient';

export interface CreateTaskPayload {
  title: string;
  description: string;
  ticketNumber?: string;
  assignedFrom?: string;
  assignedBy?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  taskType?: 'INCIDENT' | 'CHANGE' | 'REQUEST' | string;
  taskStatus?: 'INPROGRES' | 'HOLD' | 'COMPLETED' | string;
  status?: string;
  implementationDetails?: string;
  startDate?: string;
  dueDate?: string;
}

export const TASKS_QUERY_KEY = ['tasks'];

/**
 * Format Priority to API enum: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
 */
export function formatPriorityForApi(priority?: string): string {
  if (!priority) return 'HIGH';
  const p = priority.toUpperCase().trim();
  if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(p)) return p;
  if (p === 'MED') return 'MEDIUM';
  if (p === 'URGENT') return 'CRITICAL';
  return 'HIGH';
}

/**
 * Format TaskType to API enum: 'INCIDENT' | 'CHANGE' | 'REQUEST'
 */
export function formatTaskTypeForApi(taskType?: string): string {
  if (!taskType) return 'INCIDENT';
  const t = taskType.toUpperCase().trim().replace(/[\s_-]+/g, '');
  if (t === 'INCIDENT') return 'INCIDENT';
  if (t === 'CHANGE') return 'CHANGE';
  if (t === 'REQUEST') return 'REQUEST';
  return t;
}

/**
 * Format TaskStatus to API enum: 'TODO' | 'INPROGRES' | 'ON_HOLD' | 'COMPLETED'
 */
export function formatTaskStatusForApi(status?: string): string {
  if (!status) return 'INPROGRES';
  const s = status.toUpperCase().trim().replace(/[\s_-]+/g, '');
  if (s === 'INPROGRES' || s === 'INPROGRESS') return 'INPROGRES';
  if (s === 'TODO') return 'TODO';
  if (s === 'ONHOLD' || s === 'ON_HOLD') return 'ON_HOLD';
  if (s === 'COMPLETED' || s === 'DONE') return 'COMPLETED';
  return s;
}

/**
 * Build request body matching the user's API specification:
 * {
 *   "title": "Implement payment service",
 *   "description": "Implement payment processing API",
 *   "ticketNumber": "RITM001298",
 *   "assignedFrom": "Backend Team",
 *   "priority": "HIGH",
 *   "taskType": "INCIDENT",
 *   "taskStatus": "INPROGRES",
 *   "implementationDetails": "...",
 *   "startDate": "2026-08-20",
 *   "dueDate": "2026-08-30"
 * }
 */
export function buildApiTaskPayload(payload: CreateTaskPayload): ApiTaskPayload {
  const taskType = formatTaskTypeForApi(payload.taskType);
  const taskStatus = formatTaskStatusForApi(payload.taskStatus || payload.status);
  const priority = formatPriorityForApi(payload.priority);

  let ticketNumber = payload.ticketNumber;
  if (!ticketNumber || ticketNumber.trim() === '') {
    if (taskType === 'INCIDENT') {
      ticketNumber = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (taskType === 'CHANGE') {
      ticketNumber = `CHG-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      ticketNumber = `RITM${Math.floor(100000 + Math.random() * 900000)}`;
    }
  }

  return {
    title: payload.title || '',
    description: payload.description || '',
    ticketNumber,
    assignedFrom: payload.assignedFrom || payload.assignedBy || 'Backend Team',
    priority,
    taskType,
    taskStatus,
    implementationDetails: payload.implementationDetails || '',
    startDate: payload.startDate || undefined,
    dueDate: payload.dueDate || undefined,
  };
}

/**
 * Normalize Spring Boot Task response to frontend Task model
 */
export function normalizeTaskFromApi(raw: any): Task {
  if (!raw || typeof raw !== 'object') return raw;

  let status = TaskStatus.Todo;
  const rawStatus = String(raw.taskStatus || raw.status || '').toUpperCase().replace(/[\s_-]+/g, '');
  if (rawStatus === 'INPROGRES' || rawStatus === 'INPROGRESS') {
    status = TaskStatus.InProgress;
  } else if (rawStatus === 'ONHOLD' || rawStatus === 'ON_HOLD') {
    status = TaskStatus.OnHold;
  } else if (rawStatus === 'COMPLETED' || rawStatus === 'DONE') {
    status = TaskStatus.Completed;
  } else if (rawStatus === 'TODO') {
    status = TaskStatus.Todo;
  } else if (Object.values(TaskStatus).includes(raw.status)) {
    status = raw.status;
  }

  let taskType = TaskType.Request;
  const rawType = String(raw.taskType || raw.type || '').toUpperCase().replace(/[\s_-]+/g, '');
  if (rawType === 'INCIDENT') taskType = TaskType.Incident;
  else if (rawType === 'CHANGE') taskType = TaskType.Change;
  else if (rawType === 'REQUEST') taskType = TaskType.Request;
  else if (Object.values(TaskType).includes(raw.taskType)) taskType = raw.taskType;

  let priority = TaskPriority.Medium;
  const rawPrio = String(raw.priority || '').toUpperCase().trim();
  if (rawPrio === 'LOW') priority = TaskPriority.Low;
  else if (rawPrio === 'MEDIUM' || rawPrio === 'MED') priority = TaskPriority.Medium;
  else if (rawPrio === 'HIGH') priority = TaskPriority.High;
  else if (rawPrio === 'CRITICAL' || rawPrio === 'URGENT') priority = TaskPriority.Critical;
  else if (Object.values(TaskPriority).includes(raw.priority)) priority = raw.priority;

  return {
    id: String(raw.id || `task-${Date.now()}`),
    ticketNumber: String(raw.ticketNumber || raw.ticket_number || 'TASK-001'),
    title: String(raw.title || 'Untitled Task'),
    description: String(raw.description || ''),
    implementationDetails: raw.implementationDetails || raw.implementation_details || '',
    taskType,
    priority,
    taskStatus:status,
    startDate: raw.startDate || raw.start_date || undefined,
    dueDate: raw.dueDate || raw.due_date || undefined,
    assignedFrom: raw.assignedFrom || raw.assigned_from || raw.assignedBy || 'Backend Team',
    assignedTo: raw.assignedTo || raw.assigned_to || undefined,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
    isArchived: Boolean(raw.isArchived || raw.is_archived),
  };
}

/**
 * Task Service Function using Axios to post to Spring Boot API
 * Endpoint: POST http://localhost:8080/api/v1/tasks
 */
export async function createTaskApi(
  payload: CreateTaskPayload,
  customBaseUrl?: string
): Promise<Task> {
  const requestBody = buildApiTaskPayload(payload);

  const response = await apiClient.post<ApiResponse<Task> | Task>(
    '/api/v1/tasks',
    requestBody,
    customBaseUrl ? { baseURL: customBaseUrl } : undefined
  );

  const resData = response.data as any;
  let rawTask: any;
  if (resData && typeof resData === 'object' && 'data' in resData && 'success' in resData) {
    rawTask = resData.data;
  } else {
    rawTask = resData;
  }
  return normalizeTaskFromApi(rawTask);
}

/**
 * Custom React Query Hook for task creation using Axios
 */
export function useCreateTask(options?: {
  baseUrl?: string;
  onSuccess?: (data: Task) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      createTaskApi(payload, options?.baseUrl),
    onSuccess: (data) => {
      // Invalidate React Query task cache
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });

      // Audit trail logging
      const prioStr = String(data?.priority || '').toUpperCase();
      useAuditStore.getState().addLog(
        'task_created',
        data?.ticketNumber || payloadTicketNumber(data) || 'TASK',
        `Created task: ${data?.title || 'Untitled'}`,
        prioStr === 'CRITICAL' || prioStr === 'HIGH' ? 'warning' : 'info'
      );

      // Refresh Zustand store for application state synchronization
      fetchTasks();

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      console.error('[React Query / Axios] Failed to create task:', error);
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

function payloadTicketNumber(data: any): string {
  return data?.ticketNumber || 'TASK';
}
