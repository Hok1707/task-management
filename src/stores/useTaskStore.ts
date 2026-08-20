import { create } from 'zustand';
import { Task, TaskPriority, TaskStatus, TaskType, PaginationMeta } from '../types';
import { useAuditStore } from './useAuditStore';
import { taskApi } from '../services/taskApi';

export interface DateFilterState {
  startDate?: string;
  endDate?: string;
  field: 'dueDate' | 'startDate' | 'createdAt';
}

interface TaskState {
  tasks: Task[];
  pagination: PaginationMeta;
  statusCounts: Record<TaskStatus, number>;
  totalUnfiltered: number;
  isLoading: boolean;
  isOfflineFallback: boolean;
  error: string | null;

  // Sorting
  sortField: string;
  sortOrder: 'asc' | 'desc';
  setSort: (field: string, order?: 'asc' | 'desc') => void;

  // Pagination controls
  setPage: (page: number) => void;
  setPageSize: (limit: number) => void;

  // Filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: TaskStatus[];
  setFilterStatus: (statuses: TaskStatus[]) => void;
  filterType: TaskType[];
  setFilterType: (types: TaskType[]) => void;
  dateFilter: DateFilterState;
  setDateFilter: (filter: Partial<DateFilterState>) => void;
  clearDateFilter: () => void;
  resetFilters: () => void;
  quickFilter: 'all' | 'active' | 'completed' | 'archived';
  setQuickFilter: (filter: 'all' | 'active' | 'completed' | 'archived') => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;

  // UI State
  viewMode: 'kanban' | 'list' | 'analytics';
  setViewMode: (mode: 'kanban' | 'list' | 'analytics') => void;
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;

  // Data fetching & Spring Boot API Mutations
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  loadDemoTasks: () => Promise<void>;
  generateStressTestTasks: (count?: number) => Promise<void>;
  archiveCompletedTasks: () => Promise<void>;
  toggleArchiveTask: (id: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;
  addTemplateTask: (template: 'incident' | 'change' | 'request') => Promise<void>;
  exportTasksJSON: () => Promise<void>;
  importTasksJSON: (importedTasks: Task[]) => Promise<void>;
}

let searchDebounceTimer: NodeJS.Timeout | null = null;

const INITIAL_DEMO_TASKS: Task[] = [
  {
    id: 'task-101',
    ticketNumber: 'INC-8921',
    title: 'PostgreSQL Connection Pool Exhaustion under load',
    description: 'Database connection timeouts spiking on user authentication service during batch sync jobs.',
    implementationDetails: 'Increase max_connections in postgresql.conf and tune HikariCP maximumPoolSize to 50.',
    status: TaskStatus.InProgress,
    priority: TaskPriority.Critical,
    taskType: TaskType.Incident,
    assignedBy: 'Alex Rivera',
    assignedTo: 'Backend Team',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-102',
    ticketNumber: 'CHG-4420',
    title: 'Migrate Spring Boot microservices to Spring Boot 3.4',
    description: 'Upgrade Jakarta EE baseline and verify native compilation profile compatibility.',
    implementationDetails: 'Update pom.xml dependencies and migrate deprecated SecurityFilterChain builders.',
    status: TaskStatus.Todo,
    priority: TaskPriority.High,
    taskType: TaskType.Change,
    assignedBy: 'DevOps Lead',
    assignedTo: 'Platform Team',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-103',
    ticketNumber: 'REQ-1209',
    title: 'Implement Redis Distributed Cache for JWT Token Verification',
    description: 'Offload token validation query traffic from primary database to Redis cluster.',
    implementationDetails: 'Configure Spring Cache Manager with RedisTemplate and set TTL to 3600 seconds.',
    status: TaskStatus.Completed,
    priority: TaskPriority.Medium,
    taskType: TaskType.Request,
    assignedBy: 'Security Lead',
    assignedTo: 'Alex Rivera',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-104',
    ticketNumber: 'INC-9014',
    title: 'Kubernetes Ingress Gateway 502 Bad Gateway error spike',
    description: 'Intermittent upstream resets reported by cloud load balancer during rolling container updates.',
    implementationDetails: 'Set preStop lifecycle hook sleep 10s and increase terminationGracePeriodSeconds to 60.',
    status: TaskStatus.OnHold,
    priority: TaskPriority.Critical,
    taskType: TaskType.Incident,
    assignedBy: 'Alex Rivera',
    assignedTo: 'SRE Team',
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-105',
    ticketNumber: 'CHG-4451',
    title: 'Rotate AWS IAM STS credentials & refresh staging secrets',
    description: 'Quarterly compliance access token cycle across CI/CD runner environments.',
    implementationDetails: 'Generate new KMS keys and update GitHub Secrets Vault.',
    status: TaskStatus.Completed,
    priority: TaskPriority.Low,
    taskType: TaskType.Change,
    assignedBy: 'Compliance Officer',
    assignedTo: 'Alex Rivera',
    dueDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed initial fallback data if empty
if (typeof window !== 'undefined' && !localStorage.getItem('spring_boot_fallback_tasks_v2')) {
  taskApi.seedDemoWorkload(INITIAL_DEMO_TASKS);
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  statusCounts: {
    [TaskStatus.Todo]: 0,
    [TaskStatus.InProgress]: 0,
    [TaskStatus.OnHold]: 0,
    [TaskStatus.Completed]: 0,
  },
  totalUnfiltered: 0,
  isLoading: false,
  isOfflineFallback: false,
  error: null,

  sortField: 'createdAt',
  sortOrder: 'desc',

  searchQuery: '',
  filterStatus: [],
  filterType: [],
  dateFilter: { field: 'dueDate' },
  quickFilter: 'all',
  showArchived: false,

  viewMode: 'kanban',
  isCreateModalOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),

  setSort: (field, explicitOrder) => {
    const currentField = get().sortField;
    const currentOrder = get().sortOrder;
    let nextOrder: 'asc' | 'desc' = explicitOrder || 'desc';

    if (!explicitOrder && currentField === field) {
      nextOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    }

    set({ sortField: field, sortOrder: nextOrder });
    get().fetchTasks();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchTasks();
  },

  setPageSize: (limit) => {
    set((state) => ({
      pagination: { ...state.pagination, limit, page: 1 },
    }));
    get().fetchTasks();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      set((state) => ({ pagination: { ...state.pagination, page: 1 } }));
      get().fetchTasks();
    }, 250);
  },

  setFilterStatus: (statuses) => {
    set((state) => ({
      filterStatus: statuses,
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  setFilterType: (types) => {
    set((state) => ({
      filterType: types,
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  setDateFilter: (filter) => {
    set((state) => ({
      dateFilter: { ...state.dateFilter, ...filter },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  clearDateFilter: () => {
    set((state) => ({
      dateFilter: { field: 'dueDate', startDate: undefined, endDate: undefined },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  setQuickFilter: (filter) => {
    set((state) => ({
      quickFilter: filter,
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  setShowArchived: (show) => {
    set((state) => ({
      showArchived: show,
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  resetFilters: () => {
    set((state) => ({
      searchQuery: '',
      filterStatus: [],
      filterType: [],
      quickFilter: 'all',
      showArchived: false,
      dateFilter: { field: 'dueDate', startDate: undefined, endDate: undefined },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchTasks();
  },

  fetchTasks: async () => {
    const {
      pagination,
      searchQuery,
      filterStatus,
      filterType,
      dateFilter,
      quickFilter,
      showArchived,
      sortField,
      sortOrder,
    } = get();

    set({ isLoading: true, error: null });

    try {
      const result = await taskApi.getTasks({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: filterStatus,
        taskType: filterType,
        quickFilter,
        showArchived,
        sortField,
        sortOrder,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
        dateField: dateFilter.field,
      });

      set({
        tasks: result.tasks,
        pagination: result.pagination,
        statusCounts: result.statusCounts,
        totalUnfiltered: result.totalUnfiltered,
        isOfflineFallback: Boolean(result.isOfflineFallback),
        isLoading: false,
      });
    } catch (err: unknown) {
      console.error('Failed to fetch tasks from API:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch tasks',
      });
    }
  },

  addTask: async (taskData) => {
    try {
      const created = await taskApi.createTask(taskData);
      useAuditStore.getState().addLog(
        'task_created',
        created.ticketNumber,
        `Created ${created.taskType}: ${created.title}`,
        created.priority === TaskPriority.Critical ? 'warning' : 'info'
      );
      await get().fetchTasks();
    } catch (err: unknown) {
      console.error('Error adding task:', err);
    }
  },

  updateTask: async (id, updatedFields) => {
    const previousTasks = get().tasks;
    const existing = previousTasks.find((t) => t.id === id);

    // Optimistic UI update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updatedFields, updatedAt: new Date().toISOString() } : t
      ),
    }));

    try {
      await taskApi.updateTask(id, updatedFields);
      if (existing && updatedFields.status && updatedFields.status !== existing.status) {
        useAuditStore.getState().addLog(
          'task_status_changed',
          existing.ticketNumber,
          `Status transitioned from ${existing.status} to ${updatedFields.status}`,
          updatedFields.status === TaskStatus.Completed ? 'info' : 'warning'
        );
      } else if (existing) {
        useAuditStore.getState().addLog(
          'task_updated',
          existing.ticketNumber,
          `Updated details for ${existing.ticketNumber}: ${existing.title}`,
          'info'
        );
      }
      get().fetchTasks();
    } catch (err: unknown) {
      console.error('Error updating task:', err);
      set({ tasks: previousTasks });
    }
  },

  deleteTask: async (id) => {
    const existing = get().tasks.find((t) => t.id === id);
    try {
      await taskApi.deleteTask(id);
      if (existing) {
        useAuditStore.getState().addLog(
          'task_deleted',
          existing.ticketNumber,
          `Deleted task ${existing.ticketNumber}: ${existing.title}`,
          'warning'
        );
      }
      await get().fetchTasks();
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
    }
  },

  loadDemoTasks: async () => {
    taskApi.seedDemoWorkload(INITIAL_DEMO_TASKS);
    useAuditStore.getState().addLog(
      'task_created',
      'SYSTEM',
      'Restored sample developer tasks to workspace',
      'info'
    );
    await get().fetchTasks();
  },

  generateStressTestTasks: async (count = 1000) => {
    const generated: Task[] = [];
    const priorities = [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical];
    const statuses = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.OnHold, TaskStatus.Completed];
    const types = [TaskType.Incident, TaskType.Change, TaskType.Request];
    const services = ['Auth-Service', 'Payment-Gateway', 'Redis-Cluster', 'Postgres-DB', 'Ingress-Controller', 'Kafka-Queue'];

    for (let i = 1; i <= count; i++) {
      const p = priorities[i % priorities.length];
      const s = statuses[i % statuses.length];
      const t = types[i % types.length];
      const srv = services[i % services.length];

      generated.push({
        id: `bench-task-${i}-${Date.now()}`,
        ticketNumber: `BENCH-${1000 + i}`,
        title: `Scale benchmark ticket #${i} for ${srv}`,
        description: `Automated test workload ticket simulating enterprise microservices state for ${srv}.`,
        status: s,
        priority: p,
        taskType: t,
        assignedBy: 'Benchmark Runner',
        assignedTo: `Engineer ${(i % 10) + 1}`,
        dueDate: new Date(Date.now() + (i % 30) * 86400000).toISOString(),
        implementationDetails: `Verification steps for ${srv}: check latency percentiles and resource allocation.`,
        isArchived: false,
        createdAt: new Date(Date.now() - (i % 60) * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    taskApi.seedDemoWorkload(generated);
    useAuditStore.getState().addLog(
      'task_created',
      'SYSTEM',
      `Generated ${count} tasks for Spring Boot pagination benchmark test`,
      'info'
    );
    set((state) => ({ pagination: { ...state.pagination, page: 1 } }));
    await get().fetchTasks();
  },

  archiveCompletedTasks: async () => {
    const current = get().tasks;
    let count = 0;
    for (const t of current) {
      if (t.status === TaskStatus.Completed && !t.isArchived) {
        await taskApi.updateTask(t.id, { isArchived: true });
        count++;
      }
    }
    useAuditStore.getState().addLog(
      'task_updated',
      'SYSTEM',
      `Archived ${count} completed tasks into cold storage`,
      'info'
    );
    await get().fetchTasks();
  },

  toggleArchiveTask: async (id) => {
    const t = get().tasks.find((task) => task.id === id);
    if (t) {
      await taskApi.updateTask(id, { isArchived: !t.isArchived });
      await get().fetchTasks();
    }
  },

  clearAllTasks: async () => {
    taskApi.seedDemoWorkload([]);
    useAuditStore.getState().addLog(
      'task_deleted',
      'SYSTEM',
      'Cleared all tasks from workspace',
      'warning'
    );
    set({
      tasks: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      statusCounts: {
        [TaskStatus.Todo]: 0,
        [TaskStatus.InProgress]: 0,
        [TaskStatus.OnHold]: 0,
        [TaskStatus.Completed]: 0,
      },
      totalUnfiltered: 0,
    });
  },

  exportTasksJSON: async () => {
    const res = await taskApi.getTasks({ limit: 10000 });
    const dataStr = JSON.stringify(res.tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importTasksJSON: async (importedTasks) => {
    taskApi.seedDemoWorkload(importedTasks);
    useAuditStore.getState().addLog(
      'task_created',
      'SYSTEM',
      `Restored ${importedTasks.length} tasks from backup archive`,
      'info'
    );
    await get().fetchTasks();
  },

  addTemplateTask: async (template) => {
    const templates = {
      incident: {
        title: 'SSO 504 Gateway Timeout during peak traffic',
        description: 'Users on US-East experiencing intermittent authentication failures.',
        implementationDetails: 'Check ingress nginx rate limits and pod memory limits.',
        taskType: TaskType.Incident,
        priority: TaskPriority.Critical,
        status: TaskStatus.InProgress,
        assignedBy: 'Alex Rivera',
      },
      change: {
        title: 'Upgrade PostgreSQL cluster to v16.2',
        description: 'Apply security patches and test replication failover in Staging.',
        implementationDetails: 'Run terraform apply on database module and execute pg_upgrade.',
        taskType: TaskType.Change,
        priority: TaskPriority.High,
        status: TaskStatus.Todo,
        assignedBy: 'Alex Rivera',
      },
      request: {
        title: 'Provision developer Redis cache cluster',
        description: 'Allocate dedicated Redis cache instance for session state testing.',
        implementationDetails: 'Update helm values.yaml for caching layer.',
        taskType: TaskType.Request,
        priority: TaskPriority.Medium,
        status: TaskStatus.Todo,
        assignedBy: 'Alex Rivera',
      },
    };
    const selected = templates[template];
    await get().addTask(selected);
  },
}));
