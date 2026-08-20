export enum TaskType {
  Incident = 'Incident',
  Change = 'Change',
  Request = 'Request',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  Completed = 'Completed',
}

export interface Task {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  implementationDetails?: string;
  taskType: TaskType;
  priority: TaskPriority;
  taskStatus: TaskStatus;
  startDate?: string;
  dueDate?: string;
  assignedFrom?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface ApiTaskPayload {
  title: string;
  description: string;
  ticketNumber: string;
  assignedFrom: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  taskType: 'INCIDENT' | 'CHANGE' | 'REQUEST' | string;
  taskStatus: 'TODO' | 'INPROGRES' | 'ON_HOLD' | 'COMPLETED' | string;
  implementationDetails?: string;
  startDate?: string;
  dueDate?: string;
}

export interface EnvironmentVault {
  id: string;
  envName: string;
  baseUrl: string;
  username: string;
  secretKey: string; // masked/encrypted in UI
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export type AuditLogAction =
  | 'task_created'
  | 'task_status_changed'
  | 'task_updated'
  | 'task_deleted'
  | 'vault_created'
  | 'vault_revealed'
  | 'vault_updated'
  | 'vault_deleted'
  | 'postmortem_generated';

export type AuditLogSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditLogAction;
  target: string;
  details: string;
  actor: string;
  severity: AuditLogSeverity;
}

export interface PostMortemTimelineItem {
  id: string;
  time: string;
  event: string;
}

export interface PostMortemActionItem {
  id: string;
  action: string;
  owner: string;
  status: 'open' | 'done';
}

export interface PostMortemData {
  ticketNumber: string;
  title: string;
  incidentLead: string;
  severity: TaskPriority;
  taskType: TaskType;
  incidentDate: string;
  duration: string;
  impactedServices: string;
  summary: string;
  rootCause: string;
  timeline: PostMortemTimelineItem[];
  actionItems: PostMortemActionItem[];
  runbookSteps: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: FieldError[];
}

export interface TasksResponse {
  tasks: Task[];
  pagination: PaginationMeta;
  statusCounts: Record<TaskStatus, number>;
  totalUnfiltered: number;
}

export interface TaskAnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  criticalTasks: number;
  completionRate: number;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  priorityDistribution: Array<{ name: string; count: number; color: string }>;
  typeStatusBreakdown: Array<{ name: string; Todo: number; InProgress: number; OnHold: number; Completed: number }>;
  overdueTasksCount: number;
  upcomingTasksCount: number;
  criticalOpenCount: number;
}
