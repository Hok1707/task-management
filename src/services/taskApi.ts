import { Task, TaskPriority, TaskStatus, TaskType, TaskAnalyticsData, ApiResponse, PageResponse } from '../types';
import { apiClient, getApiBaseUrl, setApiBaseUrl } from './apiClient';
import {
  buildApiTaskPayload,
  normalizeTaskFromApi,
  formatTaskStatusForApi,
  formatTaskTypeForApi,
  formatPriorityForApi,
} from './useCreateTaskQuery';

export { getApiBaseUrl, setApiBaseUrl };

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  taskType?: string[];
  quickFilter?: string;
  showArchived?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  dateField?: string;
}

const LOCAL_STORAGE_KEY = 'spring_boot_fallback_tasks_v2';

/**
 * Utility helper to unwrap Spring Boot ApiResponse<T> wrapper if present
 */
export function unwrapResponse<T>(data: any): T {
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    return data.data as T;
  }
  return data as T;
}

function getLocalFallbackTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local fallback tasks', e);
  }
  return [];
}

function saveLocalFallbackTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to save local fallback tasks', e);
  }
}

export const taskApi = {
  /**
   * GET /api/v1/tasks
   * Accepts Pageable (page, size, sort) and filter params.
   * Parses PageResponse<TaskResponse> and ApiResponse<PageResponse<TaskResponse>>.
   */
  async getTasks(params: TaskQueryParams = {}): Promise<{
    tasks: Task[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    statusCounts: Record<TaskStatus, number>;
    totalUnfiltered: number;
    isOfflineFallback?: boolean;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20; // Default Spring Boot @PageableDefault size=20

    // Format query parameters according to Spring Data Pageable specs
    const queryParams: Record<string, string> = {
      page: String(page - 1), // 0-indexed for Spring Pageable
      size: String(limit),
      sort: `${params.sortField || 'createdAt'},${params.sortOrder || 'desc'}`,
    };

    if (params.search) {
      queryParams.search = params.search;
      queryParams.q = params.search;
    }
    if (params.status && params.status.length > 0) {
      queryParams.status = params.status.join(',');
    }
    if (params.taskType && params.taskType.length > 0) {
      queryParams.taskType = params.taskType.join(',');
    }
    if (params.quickFilter) queryParams.quickFilter = params.quickFilter;
    if (params.showArchived !== undefined) queryParams.showArchived = String(params.showArchived);
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.dateField) queryParams.dateField = params.dateField;

    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/tasks', { params: queryParams });
      } catch {
        response = await apiClient.get('/api/tasks', { params: queryParams });
      }

      const rawData = response.data;
      const data = unwrapResponse<PageResponse<Task> | Task[] | any>(rawData);

      let taskList: Task[] = [];
      let total = 0;
      let totalPages = 1;

      if (Array.isArray(data)) {
        taskList = data.map(normalizeTaskFromApi);
        total = data.length;
        totalPages = Math.max(1, Math.ceil(total / limit));
      } else if (data && typeof data === 'object') {
        // PageResponse<T> handling: content, page, size, totalElements, totalPages
        if (Array.isArray(data.content)) {
          taskList = data.content.map(normalizeTaskFromApi);
          total = data.totalElements ?? data.content.length;
          totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit));
        } else if (Array.isArray(data.data)) {
          taskList = data.data.map(normalizeTaskFromApi);
          total = data.total ?? data.data.length;
          totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit));
        } else if (Array.isArray(data.tasks)) {
          taskList = data.tasks.map(normalizeTaskFromApi);
          total = data.total ?? data.tasks.length;
          totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit));
        }
      }

      const statusCounts: Record<TaskStatus, number> = {
        [TaskStatus.Todo]: 0,
        [TaskStatus.InProgress]: 0,
        [TaskStatus.OnHold]: 0,
        [TaskStatus.Completed]: 0,
      };

      if (data && data.statusCounts) {
        Object.assign(statusCounts, data.statusCounts);
      } else {
        taskList.forEach((t) => {
          if (t.taskStatus && statusCounts[t.taskStatus] !== undefined) {
            statusCounts[t.taskStatus]++;
          }
        });
      }

      return {
        tasks: taskList,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        statusCounts,
        totalUnfiltered: data?.totalUnfiltered ?? total,
        isOfflineFallback: false,
      };
    } catch (err) {
      console.warn('[Spring Boot API] Could not fetch tasks via Axios. Falling back to local mode.', err);
    }

    return this.getLocalPaginatedTasks(params);
  },

  /**
   * GET /api/v1/tasks/{id}
   * Returns single TaskResponse (unwrapped from ApiResponse<TaskResponse> if needed)
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      let response;
      try {
        response = await apiClient.get(`/api/v1/tasks/${id}`);
      } catch {
        response = await apiClient.get(`/api/tasks/${id}`);
      }
      const raw = unwrapResponse<any>(response.data);
      return raw ? normalizeTaskFromApi(raw) : null;
    } catch (err) {
      console.warn(`[Spring Boot API] Failed to fetch task ${id}`, err);
    }

    const localTasks = getLocalFallbackTasks();
    return localTasks.find((t) => t.id === id) || null;
  },

  /**
   * POST /api/v1/tasks
   * Accepts Task creation payload and unwraps ApiResponse<TaskResponse>
   */
  async createTask(taskData: Partial<Task> & { assignedFrom?: string; taskStatus?: string }): Promise<Task> {
    const requestBody = buildApiTaskPayload(taskData as any);

    try {
      let response;
      try {
        response = await apiClient.post('/api/v1/tasks', requestBody);
      } catch {
        response = await apiClient.post('/api/tasks', requestBody);
      }
      const rawTask = unwrapResponse<any>(response.data);
      return normalizeTaskFromApi(rawTask);
    } catch (err) {
      console.warn('[Spring Boot API] POST failed, saving to local fallback storage', err);
    }

    const localTasks = getLocalFallbackTasks();
    const newTask: Task = {
      id: taskData.id,
      ticketNumber: requestBody.ticketNumber,
      title: requestBody.title,
      description: requestBody.description,
      taskStatus: taskData.taskStatus || TaskStatus.OnHold,
      priority: taskData.priority || TaskPriority.Medium,
      taskType: taskData.taskType || TaskType.Request,
      assignedFrom: requestBody.assignedFrom,
      assignedTo: taskData.assignedTo || 'Unassigned',
      dueDate: requestBody.dueDate || '',
      startDate: requestBody.startDate || '',
      implementationDetails: requestBody.implementationDetails || '',
      isArchived: Boolean(taskData.isArchived),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localTasks.unshift(newTask);
    saveLocalFallbackTasks(localTasks);
    return newTask;
  },

  /**
   * PUT /api/v1/tasks/{id}
   * Updates task and unwraps ApiResponse<TaskResponse>
   */
  async updateTask(id: string, updates: Partial<Task> & { taskStatus?: string }): Promise<Task | null> {
    const updateBody: Record<string, any> = { ...updates };
    if (updates.taskStatus || updates.taskStatus) {
      updateBody.taskStatus = formatTaskStatusForApi(updates.taskStatus || updates.taskStatus);
    }
    if (updates.taskType) {
      updateBody.taskType = formatTaskTypeForApi(updates.taskType);
    }
    if (updates.priority) {
      updateBody.priority = formatPriorityForApi(updates.priority);
    }

    try {
      let response;
      try {
        response = await apiClient.put(`/api/v1/tasks/${id}`, updateBody);
      } catch {
        response = await apiClient.put(`/api/tasks/${id}`, updateBody);
      }
      const rawTask = unwrapResponse<any>(response.data);
      return normalizeTaskFromApi(rawTask);
    } catch (err) {
      console.warn('[Spring Boot API] PUT failed, updating local fallback storage', err);
    }

    const localTasks = getLocalFallbackTasks();
    const idx = localTasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      localTasks[idx] = {
        ...localTasks[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveLocalFallbackTasks(localTasks);
      return localTasks[idx];
    }
    return null;
  },

  /**
   * DELETE /api/v1/tasks/{id}
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      try {
        await apiClient.delete(`/api/v1/tasks/${id}`);
      } catch {
        await apiClient.delete(`/api/tasks/${id}`);
      }
      return true;
    } catch (err) {
      console.warn('[Spring Boot API] DELETE failed, removing from local fallback storage', err);
    }

    const localTasks = getLocalFallbackTasks();
    const filtered = localTasks.filter((t) => t.id !== id);
    saveLocalFallbackTasks(filtered);
    return true;
  },

  /**
   * GET /api/v1/tasks/analytics
   */
  async getAnalytics(): Promise<TaskAnalyticsData> {
    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/tasks/analytics');
      } catch {
        response = await apiClient.get('/api/tasks/analytics');
      }
      return unwrapResponse<TaskAnalyticsData>(response.data);
    } catch (err) {
      console.warn('[Spring Boot API] Analytics endpoint unavailable, computing locally', err);
    }

    const allTasks = getLocalFallbackTasks();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.taskStatus === TaskStatus.Completed).length;
    const inProgressTasks = allTasks.filter((t) => t.taskStatus === TaskStatus.InProgress).length;
    const criticalTasks = allTasks.filter(
      (t) => t.priority === TaskPriority.Critical && t.taskStatus !== TaskStatus.Completed
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const statusDistribution = Object.values(TaskStatus).map((status) => ({
      name: status,
      value: allTasks.filter((t) => t.taskStatus === status).length,
      color:
        status === TaskStatus.Completed
          ? '#10b981'
          : status === TaskStatus.InProgress
          ? '#3b82f6'
          : status === TaskStatus.OnHold
          ? '#f59e0b'
          : '#64748b',
    }));

    const priorityDistribution = Object.values(TaskPriority).map((priority) => ({
      name: priority,
      count: allTasks.filter((t) => t.priority === priority).length,
      color:
        priority === TaskPriority.Critical
          ? '#ef4444'
          : priority === TaskPriority.High
          ? '#f97316'
          : priority === TaskPriority.Medium
          ? '#3b82f6'
          : '#94a3b8',
    }));

    const typeStatusBreakdown = Object.values(TaskType).map((type) => {
      const filtered = allTasks.filter((t) => t.taskType === type);
      return {
        name: type,
        Todo: filtered.filter((t) => t.taskStatus === TaskStatus.Todo).length,
        InProgress: filtered.filter((t) => t.taskStatus === TaskStatus.InProgress).length,
        OnHold: filtered.filter((t) => t.taskStatus === TaskStatus.OnHold).length,
        Completed: filtered.filter((t) => t.taskStatus === TaskStatus.Completed).length,
      };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasksCount = allTasks.filter(
      (t) => t.dueDate && t.dueDate < todayStr && t.taskStatus !== TaskStatus.Completed
    ).length;
    const upcomingTasksCount = allTasks.filter(
      (t) => t.dueDate && t.dueDate >= todayStr && t.taskStatus !== TaskStatus.Completed
    ).length;
    const criticalOpenCount = criticalTasks;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      criticalTasks,
      completionRate,
      statusDistribution,
      priorityDistribution,
      typeStatusBreakdown,
      overdueTasksCount,
      upcomingTasksCount,
      criticalOpenCount,
    };
  },

  async testConnection(customUrl?: string): Promise<{ ok: boolean; message: string }> {
    const url = (customUrl || getApiBaseUrl()).replace(/\/+$/, '');
    try {
      const res = await apiClient.get('/api/v1/tasks', { baseURL: url, params: { page: 0, size: 1 } });
      if (res.status === 200) {
        return { ok: true, message: `Connected successfully to Spring Boot API at ${url}` };
      }
      return { ok: false, message: `Server responded with status ${res.status}` };
    } catch (e: any) {
      return { ok: false, message: `Unable to reach Spring Boot API: ${e.message || e}` };
    }
  },

  getLocalPaginatedTasks(params: TaskQueryParams) {
    let tasks = getLocalFallbackTasks();
    const totalUnfiltered = tasks.length;

    if (params.quickFilter === 'archived') {
      tasks = tasks.filter((t) => t.isArchived);
    } else if (!params.showArchived) {
      tasks = tasks.filter((t) => !t.isArchived);
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.ticketNumber.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.implementationDetails && t.implementationDetails.toLowerCase().includes(q))      );
    }

    if (params.status && params.status.length > 0) {
      tasks = tasks.filter((t) => params.status!.includes(t.taskStatus));
    }

    if (params.taskType && params.taskType.length > 0) {
      tasks = tasks.filter((t) => params.taskType!.includes(t.taskType));
    }

    if (params.quickFilter === 'active') {
      tasks = tasks.filter((t) => t.taskStatus !== TaskStatus.Completed);
    } else if (params.quickFilter === 'completed') {
      tasks = tasks.filter((t) => t.taskStatus === TaskStatus.Completed);
    }

    if (params.startDate || params.endDate) {
      const field = (params.dateField as keyof Task) || 'dueDate';
      tasks = tasks.filter((t) => {
        const raw = t[field];
        if (!raw) return false;
        const dateStr = String(raw).split('T')[0];
        if (params.startDate && dateStr < params.startDate) return false;
        if (params.endDate && dateStr > params.endDate) return false;
        return true;
      });
    }

    const sortField = params.sortField || 'ticketNumber';
    const sortOrder = params.sortOrder || 'desc';
    tasks.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'priority') {
        const priorityRank: Record<TaskPriority, number> = {
          [TaskPriority.Critical]: 4,
          [TaskPriority.High]: 3,
          [TaskPriority.Medium]: 2,
          [TaskPriority.Low]: 1,
        };
        comparison = (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0);
      } else if (sortField === 'dueDate') {
        comparison = (a.dueDate || '').localeCompare(b.dueDate || '');
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        const aVal = String((a as unknown as Record<string, unknown>)[sortField] || '');
        const bVal = String((b as unknown as Record<string, unknown>)[sortField] || '');
        comparison = aVal.localeCompare(bVal);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = tasks.length;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const validPage = Math.min(page, totalPages);
    const startIndex = (validPage - 1) * limit;
    const paginatedSlice = tasks.slice(startIndex, startIndex + limit);

    const allOriginal = getLocalFallbackTasks();
    const statusCounts: Record<TaskStatus, number> = {
      [TaskStatus.Todo]: allOriginal.filter((t) => t.taskStatus === TaskStatus.Todo && !t.isArchived).length,
      [TaskStatus.InProgress]: allOriginal.filter((t) => t.taskStatus === TaskStatus.InProgress && !t.isArchived).length,
      [TaskStatus.OnHold]: allOriginal.filter((t) => t.taskStatus === TaskStatus.OnHold && !t.isArchived).length,
      [TaskStatus.Completed]: allOriginal.filter((t) => t.taskStatus === TaskStatus.Completed && !t.isArchived).length,
    };

    return {
      tasks: paginatedSlice,
      pagination: {
        total,
        page: validPage,
        limit,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      },
      statusCounts,
      totalUnfiltered,
      isOfflineFallback: true,
    };
  },

  seedDemoWorkload(tasks: Task[]) {
    saveLocalFallbackTasks(tasks);
  },
};
