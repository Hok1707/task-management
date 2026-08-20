import { Task, TaskPriority, TaskStatus, TaskType, TaskAnalyticsData } from '../types';

export interface SpringBootPageResponse<T> {
  content?: T[];
  data?: T[];
  tasks?: T[];
  totalElements?: number;
  total?: number;
  totalPages?: number;
  number?: number;
  page?: number;
  size?: number;
  limit?: number;
  first?: boolean;
  last?: boolean;
}

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
const API_URL_STORAGE_KEY = 'spring_boot_api_base_url';

export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem(API_URL_STORAGE_KEY);
  if (customUrl) return customUrl.replace(/\/+$/, '');
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return String(envUrl).replace(/\/+$/, '');
  return ''; // Default to relative '/api' or proxy
}

export function setApiBaseUrl(url: string): void {
  if (!url || url.trim() === '') {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  } else {
    localStorage.setItem(API_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

// Fallback seed tasks for offline/local simulation
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
    const baseUrl = getApiBaseUrl();
    const page = params.page || 1;
    const limit = params.limit || 50;

    // Build Spring Boot query parameters
    const query = new URLSearchParams();
    // Spring Data pageable standard (0-based) & standard page
    query.set('page', String(page - 1)); // 0-based for standard Spring Data
    query.set('pageNumber', String(page));
    query.set('size', String(limit));
    query.set('limit', String(limit));

    if (params.search) {
      query.set('search', params.search);
      query.set('q', params.search);
    }
    if (params.status && params.status.length > 0) {
      query.set('status', params.status.join(','));
    }
    if (params.taskType && params.taskType.length > 0) {
      query.set('taskType', params.taskType.join(','));
    }
    if (params.quickFilter) {
      query.set('quickFilter', params.quickFilter);
    }
    if (params.showArchived !== undefined) {
      query.set('showArchived', String(params.showArchived));
    }
    if (params.sortField) {
      query.set('sortField', params.sortField);
      query.set('sortOrder', params.sortOrder || 'asc');
      // Standard Spring Data 'sort=field,asc' format
      query.set('sort', `${params.sortField},${params.sortOrder || 'asc'}`);
    }
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.dateField) query.set('dateField', params.dateField);

    const targetUrl = `${baseUrl}/api/tasks?${query.toString()}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse Spring Data Pageable or custom REST format
        let taskList: Task[] = [];
        let total = 0;
        let totalPages = 1;

        if (Array.isArray(data)) {
          taskList = data;
          total = data.length;
          totalPages = Math.max(1, Math.ceil(total / limit));
        } else if (data.content && Array.isArray(data.content)) {
          // Spring Data Page<T> format
          taskList = data.content;
          total = data.totalElements ?? data.content.length;
          totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit));
        } else if (data.data && Array.isArray(data.data)) {
          taskList = data.data;
          total = data.total ?? data.data.length;
          totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit));
        } else if (data.tasks && Array.isArray(data.tasks)) {
          taskList = data.tasks;
          total = data.total ?? data.tasks.length;
          totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit));
        }

        // Compute or extract status counts
        const statusCounts: Record<TaskStatus, number> = {
          [TaskStatus.Todo]: 0,
          [TaskStatus.InProgress]: 0,
          [TaskStatus.OnHold]: 0,
          [TaskStatus.Completed]: 0,
        };

        if (data.statusCounts) {
          Object.assign(statusCounts, data.statusCounts);
        } else {
          taskList.forEach((t) => {
            if (t.status && statusCounts[t.status] !== undefined) {
              statusCounts[t.status]++;
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
          totalUnfiltered: data.totalUnfiltered ?? total,
          isOfflineFallback: false,
        };
      }
    } catch (err) {
      console.warn(`[Spring Boot API] Could not connect to ${targetUrl}. Falling back to local offline mode.`, err);
    }

    // Fallback: local in-memory simulation if Spring Boot is offline or not running in cloud container
    return this.getLocalPaginatedTasks(params);
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const baseUrl = getApiBaseUrl();
    const targetUrl = `${baseUrl}/api/tasks`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        const created: Task = await response.json();
        return created;
      }
    } catch (err) {
      console.warn('[Spring Boot API] POST failed, saving to local fallback storage', err);
    }

    // Local fallback creation
    const localTasks = getLocalFallbackTasks();
    const newTask: Task = {
      id: taskData.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ticketNumber: taskData.ticketNumber || `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || TaskStatus.Todo,
      priority: taskData.priority || TaskPriority.Medium,
      taskType: taskData.taskType || TaskType.Request,
      assignedBy: taskData.assignedBy || 'Current User',
      assignedTo: taskData.assignedTo || 'Unassigned',
      dueDate: taskData.dueDate || '',
      implementationDetails: taskData.implementationDetails || '',
      isArchived: Boolean(taskData.isArchived),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localTasks.unshift(newTask);
    saveLocalFallbackTasks(localTasks);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const baseUrl = getApiBaseUrl();
    const targetUrl = `${baseUrl}/api/tasks/${id}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updated: Task = await response.json();
        return updated;
      }
    } catch (err) {
      console.warn('[Spring Boot API] PUT failed, updating local fallback storage', err);
    }

    // Local fallback update
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

  async deleteTask(id: string): Promise<boolean> {
    const baseUrl = getApiBaseUrl();
    const targetUrl = `${baseUrl}/api/tasks/${id}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'DELETE',
      });
      if (response.ok) return true;
    } catch (err) {
      console.warn('[Spring Boot API] DELETE failed, removing from local fallback storage', err);
    }

    const localTasks = getLocalFallbackTasks();
    const filtered = localTasks.filter((t) => t.id !== id);
    saveLocalFallbackTasks(filtered);
    return true;
  },

  async getAnalytics(): Promise<TaskAnalyticsData> {
    const baseUrl = getApiBaseUrl();
    const targetUrl = `${baseUrl}/api/tasks/analytics`;

    try {
      const response = await fetch(targetUrl);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[Spring Boot API] Analytics endpoint unavailable, computing locally', err);
    }

    // Compute analytics from local fallback
    const allTasks = getLocalFallbackTasks();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === TaskStatus.Completed).length;
    const inProgressTasks = allTasks.filter((t) => t.status === TaskStatus.InProgress).length;
    const criticalTasks = allTasks.filter(
      (t) => t.priority === TaskPriority.Critical && t.status !== TaskStatus.Completed
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const statusDistribution = Object.values(TaskStatus).map((status) => ({
      name: status,
      value: allTasks.filter((t) => t.status === status).length,
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
        Todo: filtered.filter((t) => t.status === TaskStatus.Todo).length,
        InProgress: filtered.filter((t) => t.status === TaskStatus.InProgress).length,
        OnHold: filtered.filter((t) => t.status === TaskStatus.OnHold).length,
        Completed: filtered.filter((t) => t.status === TaskStatus.Completed).length,
      };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasksCount = allTasks.filter(
      (t) => t.dueDate && t.dueDate < todayStr && t.status !== TaskStatus.Completed
    ).length;

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
    };
  },

  async testConnection(customUrl?: string): Promise<{ ok: boolean; message: string }> {
    const url = (customUrl || getApiBaseUrl()).replace(/\/+$/, '');
    try {
      const res = await fetch(`${url}/api/tasks?page=0&size=1`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return { ok: true, message: `Connected successfully to Spring Boot at ${url || 'relative path'}` };
      }
      return { ok: false, message: `Server responded with status ${res.status} ${res.statusText}` };
    } catch (e) {
      return { ok: false, message: `Unable to reach Spring Boot API: ${(e as Error).message}` };
    }
  },

  // Helper for offline local data pagination
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
          (t.implementationDetails && t.implementationDetails.toLowerCase().includes(q)) ||
          (t.assignedBy && t.assignedBy.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status.length > 0) {
      tasks = tasks.filter((t) => params.status!.includes(t.status));
    }

    if (params.taskType && params.taskType.length > 0) {
      tasks = tasks.filter((t) => params.taskType!.includes(t.taskType));
    }

    if (params.quickFilter === 'active') {
      tasks = tasks.filter((t) => t.status !== TaskStatus.Completed);
    } else if (params.quickFilter === 'completed') {
      tasks = tasks.filter((t) => t.status === TaskStatus.Completed);
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
    const limit = params.limit || 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const validPage = Math.min(page, totalPages);
    const startIndex = (validPage - 1) * limit;
    const paginatedSlice = tasks.slice(startIndex, startIndex + limit);

    const allOriginal = getLocalFallbackTasks();
    const statusCounts: Record<TaskStatus, number> = {
      [TaskStatus.Todo]: allOriginal.filter((t) => t.status === TaskStatus.Todo && !t.isArchived).length,
      [TaskStatus.InProgress]: allOriginal.filter((t) => t.status === TaskStatus.InProgress && !t.isArchived).length,
      [TaskStatus.OnHold]: allOriginal.filter((t) => t.status === TaskStatus.OnHold && !t.isArchived).length,
      [TaskStatus.Completed]: allOriginal.filter((t) => t.status === TaskStatus.Completed && !t.isArchived).length,
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
