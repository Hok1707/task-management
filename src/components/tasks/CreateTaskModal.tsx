import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useVaultStore } from '../../stores/useVaultStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCreateTask } from '../../services/useCreateTaskQuery';
import { TaskType, TaskPriority, TaskStatus } from '../../types';

const DRAFT_STORAGE_KEY = 'create_task_draft_v1';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  ticketNumber: z.string().optional(),
  assignedFrom: z.string().optional(),
  implementationDetails: z.string().optional(),
  taskType: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const getInitialDraft = (): TaskFormValues => {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        title: parsed.title || '',
        description: parsed.description || '',
        ticketNumber: parsed.ticketNumber || '',
        assignedFrom: parsed.assignedFrom || 'Backend Team',
        implementationDetails: parsed.implementationDetails || '',
        taskType: parsed.taskType || TaskType.Request,
        priority: parsed.priority || TaskPriority.Medium,
        status: parsed.status || TaskStatus.Todo,
        startDate: parsed.startDate || '',
        dueDate: parsed.dueDate || '',
      };
    }
  } catch (e) {
    console.error('Failed to load draft from localStorage', e);
  }
  return {
    title: '',
    description: '',
    ticketNumber: '',
    assignedFrom: 'Manager',
    implementationDetails: '',
    taskType: TaskType.Request,
    priority: TaskPriority.Medium,
    status: TaskStatus.InProgress,
    startDate: '',
    dueDate: '',
  };
};

export function CreateTaskModal() {
  const { isCreateModalOpen, setCreateModalOpen, addTask } = useTaskStore();
  const { environments } = useVaultStore();
  const { user } = useAuthStore();
  const createTaskMutation = useCreateTask();
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: getInitialDraft(),
  });

  // Watch and auto-save draft to localStorage
  useEffect(() => {
    const subscription = watch((value) => {
      const hasContent = Boolean(
        value.title ||
        value.description ||
        value.implementationDetails ||
        value.startDate ||
        value.dueDate
      );
      if (hasContent) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
        setHasDraft(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // When modal is reopened, ensure form has latest draft state
  useEffect(() => {
    if (isCreateModalOpen) {
      const draft = getInitialDraft();
      const isDraftPopulated = Boolean(
        draft.title ||
        draft.description ||
        draft.implementationDetails ||
        draft.startDate ||
        draft.dueDate
      );
      if (isDraftPopulated) {
        reset(draft);
        setHasDraft(true);
      }
    }
  }, [isCreateModalOpen, reset]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreateModalOpen(false);
    };
    if (isCreateModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, setCreateModalOpen]);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    reset({
      title: '',
      description: '',
      ticketNumber: '',
      assignedFrom: 'Manager',
      implementationDetails: '',
      taskType: TaskType.Request,
      priority: TaskPriority.Medium,
      status: TaskStatus.InProgress,
      startDate: '',
      dueDate: '',
    });
  };

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate({
      title: data.title,
      description: data.description,
      ticketNumber: data.ticketNumber?.trim() || undefined,
      assignedFrom: data.assignedFrom?.trim() || user?.username || 'Manager',
      implementationDetails: data.implementationDetails || undefined,
      taskType: data.taskType,
      priority: data.priority,
      status: data.status,
      assignedBy: user?.username || 'Unknown',
      startDate: data.startDate || undefined,
      dueDate: data.dueDate || undefined,
    }, {
      onError: () => {
        // Fallback to Zustand store task creation if Spring Boot endpoint is offline
        addTask({
          title: data.title,
          description: data.description,
          ticketNumber: data.ticketNumber?.trim() || undefined as any,
          assignedFrom: data.assignedFrom?.trim() || user?.username || 'Manager',
          implementationDetails: data.implementationDetails || undefined,
          taskType: data.taskType,
          priority: data.priority,
          taskStatus: data.status,
          startDate: data.startDate || undefined,
          dueDate: data.dueDate || undefined,
        });
      }
    });

    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    reset({
      title: '',
      description: '',
      ticketNumber: '',
      assignedFrom: 'Manager',
      implementationDetails: '',
      taskType: TaskType.Request,
      priority: TaskPriority.Medium,
      status: TaskStatus.InProgress,
      startDate: '',
      dueDate: '',
    });
    setCreateModalOpen(false);
  };

  if (!isCreateModalOpen) return null;

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setCreateModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-app-panel rounded-2xl shadow-2xl border border-app-border overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-app-border bg-black/5">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-app-text tracking-tight">Create New Task</h2>
                {hasDraft && (
                  <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Draft Saved
                  </span>
                )}
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-app-text-muted hover:text-app-text transition-colors p-1.5 rounded-lg hover:bg-app-ui cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form id="create-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                    Title
                  </label>
                  <input
                    {...register('title')}
                    className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px]"
                    placeholder="e.g. Implement payment service"
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all resize-none"
                    placeholder="e.g. Implement payment processing API"
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Ticket Number (Optional)
                    </label>
                    <input
                      {...register('ticketNumber')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text font-mono text-sm transition-all min-h-[42px]"
                      placeholder="e.g. RITM001298, INC-1024 (auto-generated if empty)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Assigned From
                    </label>
                    <input
                      {...register('assignedFrom')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px]"
                      placeholder="e.g. Backend Team, DevOps"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted">
                      Implementation Details (Optional)
                    </label>
                    <span className="text-[10px] text-app-text-muted font-mono">Code, Steps & Config</span>
                  </div>
                  <textarea
                    {...register('implementationDetails')}
                    rows={3}
                    className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-xs font-mono transition-all resize-y"
                    placeholder="e.g. Use Spring Boot, PostgreSQL and Redis. Payment processing must be idempotent and support transaction rollback."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Type
                    </label>
                    <select
                      {...register('taskType')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px]"
                    >
                      {Object.values(TaskType).map((type) => (
                        <option key={type} value={type} className="bg-app-panel text-app-text">{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px]"
                    >
                      {Object.values(TaskPriority).map((priority) => (
                        <option key={priority} value={priority} className="bg-app-panel text-app-text">{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px]"
                    >
                      {Object.values(TaskStatus).map((status) => (
                        <option key={status} value={status} className="bg-app-panel text-app-text">{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px] [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full px-3.5 sm:px-4 py-2.5 bg-black/5 border border-app-border rounded-lg focus:ring-1 focus:ring-app-accent focus:border-app-accent outline-none text-app-text text-sm transition-all min-h-[42px] [color-scheme:dark]"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-app-border bg-black/5 gap-2">
              <div>
                {hasDraft && (
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 min-h-[38px]"
                    title="Clear current draft"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Discard Draft</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 sm:px-4 py-2 text-sm font-bold text-app-text-muted hover:text-app-text transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-task-form"
                  className="px-5 sm:px-6 py-2 bg-app-accent hover:bg-app-accent-hover text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[40px]"
                >
                  Create Task
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
