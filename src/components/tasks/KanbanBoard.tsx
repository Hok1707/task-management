import { useTaskStore } from '../../stores/useTaskStore';
import { useAuditStore } from '../../stores/useAuditStore';
import { Task, TaskStatus } from '../../types';
import {
  Calendar,
  MoreVertical,
  FileText,
  ShieldAlert,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Circle,
  PauseCircle,
  PlayCircle,
  Layers,
  FilterX,
  Archive,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { format } from 'date-fns';
import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const PriorityColors: Record<string, string> = {
  Low: 'text-app-text-muted bg-app-ui',
  Medium: 'text-blue-500 bg-blue-500/20',
  High: 'text-orange-500 bg-orange-500/20',
  Critical: 'text-red-500 bg-red-500/20 border-red-500/20',
};

const TypeColors: Record<string, string> = {
  Incident: 'text-red-500 bg-red-500/10 border border-red-500/20',
  Change: 'text-purple-500 bg-purple-500/10 border border-purple-500/20',
  Request: 'text-teal-500 bg-teal-500/10 border border-teal-500/20',
};

const TaskCardItem: React.FC<{ task: Task; isOverlay?: boolean }> = ({ task, isOverlay }) => {
  const { setActivePostMortemTask } = useAuditStore();
  const { updateTask, toggleArchiveTask } = useTaskStore();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div
      className={`bg-app-panel p-4 sm:p-5 rounded-2xl shadow-sm border border-app-border transition-all group relative overflow-hidden select-none ${
        isOverlay
          ? 'shadow-2xl border-app-accent ring-2 ring-app-accent/30 rotate-1 bg-app-panel/95 backdrop-blur-md cursor-grabbing'
          : 'hover:border-app-border-hover cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-app-accent-text">
            {task.ticketNumber}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TypeColors[task.taskType]}`}>
            {task.taskType.toUpperCase()}
          </span>
          {task.isArchived && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center gap-0.5">
              <Archive className="w-2.5 h-2.5" /> ARCHIVED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActivePostMortemTask(task);
            }}
            className="text-app-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-app-ui transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            title="Generate Incident Post-Mortem & Runbook"
            aria-label="Incident Post-Mortem"
          >
            <ShieldAlert className="w-4 h-4 text-red-400/80 hover:text-red-400" />
          </button>
          
          {/* Quick Status Shift Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className="text-app-text-muted hover:text-app-text p-1.5 rounded-md hover:bg-app-ui transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Quick change status"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showStatusMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-30 w-40 bg-app-panel border border-app-border rounded-xl shadow-xl py-1 text-xs"
              >
                <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-app-text-muted border-b border-app-border">
                  Move status
                </div>
                {Object.values(TaskStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateTask(task.id, { status });
                      setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-app-ui flex items-center justify-between cursor-pointer ${
                      task.status === status ? 'font-bold text-app-accent-text' : 'text-app-text'
                    }`}
                  >
                    <span>{status}</span>
                    {task.status === status && <CheckCircle2 className="w-3 h-3 text-app-accent-text" />}
                  </button>
                ))}
                <div className="border-t border-app-border my-1"></div>
                <button
                  onClick={() => {
                    toggleArchiveTask(task.id);
                    setShowStatusMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-app-ui flex items-center gap-1.5 text-app-text cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-app-text-muted" />
                  <span>{task.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h4 className="font-bold text-app-text text-sm mb-1.5 leading-snug">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-app-text-muted line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {task.implementationDetails && (
        <div className="mb-3 p-2 bg-app-ui/60 rounded-lg text-[10px] text-app-accent-text font-mono flex items-center gap-1.5 border border-app-border">
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">Runbook attached</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-app-border/40 text-xs">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PriorityColors[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>

        <div className="flex items-center gap-2 text-app-text-muted text-[11px]">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}
          <span className="w-5 h-5 rounded-full bg-app-ui flex items-center justify-center font-bold text-[9px] text-app-text border border-app-border">
            {(task.assignedBy?.[0] || 'A').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

const DraggableTaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardItem task={task} />
    </div>
  );
};

const DroppableColumn: React.FC<{
  col: { title: string; status: TaskStatus };
  tasks: Task[];
  totalStatusCount: number;
  isSingleMobileView?: boolean;
}> = ({ col, tasks, totalStatusCount, isSingleMobileView }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.status,
    data: { status: col.status },
  });

  const Icon = {
    [TaskStatus.Todo]: Circle,
    [TaskStatus.InProgress]: PlayCircle,
    [TaskStatus.OnHold]: PauseCircle,
    [TaskStatus.Completed]: CheckCircle2,
  }[col.status];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-app-ui/40 rounded-3xl p-3 sm:p-4 border transition-all h-full ${
        isOver
          ? 'border-app-accent bg-app-accent/5 ring-2 ring-app-accent/20'
          : 'border-app-border'
      } ${
        isSingleMobileView
          ? 'w-full shrink-0'
          : 'w-72 sm:w-80 md:w-84 shrink-0 snap-center'
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-app-accent-text shrink-0" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-app-text">{col.title}</h3>
        </div>
        <span className="text-xs font-mono font-bold bg-app-panel border border-app-border px-2 py-0.5 rounded-full text-app-text-muted">
          {tasks.length}
          {totalStatusCount !== tasks.length && (
            <span className="text-[10px] text-app-text-muted/70 ml-0.5">/{totalStatusCount}</span>
          )}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 min-h-[150px]">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-app-border/60 rounded-2xl flex flex-col items-center justify-center text-xs text-app-text-muted gap-1.5 p-4 text-center">
            <Icon className="w-5 h-5 opacity-40" />
            <span className="font-semibold text-[11px]">No {col.title.toLowerCase()} tickets in this page</span>
            <span className="text-[10px] opacity-60">Drag tickets here to update status</span>
          </div>
        )}
      </div>
    </div>
  );
};

export function KanbanBoard() {
  const {
    tasks,
    pagination,
    totalUnfiltered,
    statusCounts,
    isLoading,
    updateTask,
    setPage,
    setPageSize,
    resetFilters,
    setCreateModalOpen,
    loadDemoTasks,
    addTemplateTask,
  } = useTaskStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [mobileColumn, setMobileColumn] = useState<'all' | TaskStatus>('all');

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const columns = useMemo(() => [
    { title: 'To Do', status: TaskStatus.Todo },
    { title: 'In Progress', status: TaskStatus.InProgress },
    { title: 'On Hold', status: TaskStatus.OnHold },
    { title: 'Completed', status: TaskStatus.Completed },
  ], []);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    const allStatuses = Object.values(TaskStatus);
    let targetStatus: TaskStatus | undefined = allStatuses.find((s) => s === overId);

    if (!targetStatus) {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus) {
      const draggedTask = tasks.find((t) => t.id === activeTaskId);
      if (draggedTask && draggedTask.status !== targetStatus) {
        updateTask(activeTaskId, { status: targetStatus });
      }
    }
  };

  if (totalUnfiltered === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6">
        <EmptyState
          icon={Layers}
          badge="Workspace Initialized"
          title="No operational tasks in workspace"
          description="Track developer tickets, system incidents, and infrastructure rollouts with server-side pagination and audit trails."
          primaryAction={{
            label: 'Create First Task',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }}
          secondaryAction={{
            label: 'Load Demo Workload',
            onClick: loadDemoTasks,
            icon: RotateCcw,
          }}
          quickTemplates={[
            {
              label: 'Production Incident (INC)',
              onClick: () => addTemplateTask('incident'),
              icon: ShieldAlert,
            },
            {
              label: 'Database Upgrade (CHG)',
              onClick: () => addTemplateTask('change'),
              icon: Sparkles,
            },
            {
              label: 'Developer Cache (REQ)',
              onClick: () => addTemplateTask('request'),
              icon: Layers,
            },
          ]}
        />
      </div>
    );
  }

  if (pagination.total === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6">
        <EmptyState
          icon={FilterX}
          badge="No Matches Found"
          title="No tickets match your filters"
          description="We couldn't find any tickets matching your active search query or date range filters on the server."
          primaryAction={{
            label: 'Reset Filters',
            onClick: resetFilters,
            icon: RotateCcw,
          }}
          secondaryAction={{
            label: 'Create New Task',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }}
        />
      </div>
    );
  }

  const displayedColumns =
    mobileColumn === 'all'
      ? columns
      : columns.filter((col) => col.status === mobileColumn);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Board Top Control Bar for Server-Side Page Window */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0 bg-app-panel border border-app-border rounded-xl px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-app-text-muted">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-app-accent-text" />}
          <span className="font-mono text-app-text font-bold">
            Showing {tasks.length} tasks
          </span>
          <span>(Page {pagination.page} of {pagination.totalPages}, {pagination.total} matching)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-app-text-muted">
            <span className="hidden sm:inline text-[11px]">Per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-black/10 border border-app-border rounded-md px-1.5 py-0.5 text-xs text-app-text outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="p-1 rounded border border-app-border text-app-text-muted hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous batch"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-app-text">
                {pagination.page}/{pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="p-1 rounded border border-app-border text-app-text-muted hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next batch"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Column Quick Switcher */}
      <div className="flex sm:hidden items-center gap-1 overflow-x-auto pb-2 mb-2 shrink-0 no-scrollbar">
        <button
          onClick={() => setMobileColumn('all')}
          className={`px-3 py-1 text-xs font-bold rounded-lg shrink-0 transition-all ${
            mobileColumn === 'all'
              ? 'bg-app-accent text-white shadow-xs'
              : 'bg-app-panel border border-app-border text-app-text-muted'
          }`}
        >
          All Columns ({tasks.length})
        </button>
        {columns.map((col) => {
          const count = tasks.filter((t) => t.status === col.status).length;
          return (
            <button
              key={col.status}
              onClick={() => setMobileColumn(col.status)}
              className={`px-3 py-1 text-xs font-bold rounded-lg shrink-0 transition-all ${
                mobileColumn === col.status
                  ? 'bg-app-accent text-white shadow-xs'
                  : 'bg-app-panel border border-app-border text-app-text-muted'
              }`}
            >
              {col.title} ({count})
            </button>
          );
        })}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto snap-x snap-mandatory flex gap-4 sm:gap-6 items-start pb-2 min-h-0">
          {displayedColumns.map((col) => (
            <DroppableColumn
              key={col.status}
              col={col}
              tasks={tasks.filter((t) => t.status === col.status)}
              totalStatusCount={statusCounts[col.status] || 0}
              isSingleMobileView={mobileColumn !== 'all'}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardItem task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
