import { useTaskStore } from '../../stores/useTaskStore';
import { useAuditStore } from '../../stores/useAuditStore';
import { TaskPriority, TaskStatus } from '../../types';
import { format } from 'date-fns';
import {
  ShieldAlert,
  FileText,
  Plus,
  RotateCcw,
  Sparkles,
  Layers,
  FilterX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
  Loader2,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

const StatusColors: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'bg-app-ui text-app-text-muted',
  [TaskStatus.InProgress]: 'bg-app-accent/20 text-app-accent-text',
  [TaskStatus.OnHold]: 'bg-amber-500/20 text-amber-500',
  [TaskStatus.Completed]: 'bg-emerald-500/20 text-emerald-500',
};

const PriorityColors: Record<string, string> = {
  Low: 'text-app-text-muted bg-app-ui',
  Medium: 'text-blue-500 bg-blue-500/20',
  High: 'text-orange-500 bg-orange-500/20',
  Critical: 'text-red-500 bg-red-500/20 border border-red-500/20',
};

const TypeColors: Record<string, string> = {
  Incident: 'text-red-500 bg-red-500/10 border border-red-500/20',
  Change: 'text-purple-500 bg-purple-500/10 border border-purple-500/20',
  Request: 'text-teal-500 bg-teal-500/10 border border-teal-500/20',
};

export function TaskListView() {
  const {
    tasks,
    pagination,
    totalUnfiltered,
    isLoading,
    sortField,
    sortOrder,
    setSort,
    setPage,
    setPageSize,
    resetFilters,
    setCreateModalOpen,
    loadDemoTasks,
    addTemplateTask,
    toggleArchiveTask,
  } = useTaskStore();
  const { setActivePostMortemTask } = useAuditStore();

  const handleSort = (field: string) => {
    setSort(field);
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-app-accent-text" />
    ) : (
      <ArrowDown className="w-3 h-3 text-app-accent-text" />
    );
  };

  if (totalUnfiltered === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
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
      <div className="h-full flex items-center justify-center p-6">
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

  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* List Header & Server-Side Pagination Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0 bg-app-panel border border-app-border rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap text-xs text-app-text-muted">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-app-accent-text mr-1" />}
          <span className="font-bold text-app-text font-mono">
            {pagination.total === 0 ? '0' : `${startRecord}-${endRecord}`}
          </span>
          <span>of</span>
          <span className="font-bold text-app-text font-mono">{pagination.total}</span>
          <span>tickets</span>
          {totalUnfiltered !== pagination.total && (
            <span className="text-[11px] text-app-text-muted/70">
              (filtered from {totalUnfiltered} in database)
            </span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-app-accent/10 text-app-accent-text font-semibold hidden md:inline-block">
            Server-side paginated
          </span>
        </div>

        {/* Page Size & Page Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 text-xs text-app-text-muted">
            <span className="hidden sm:inline text-[11px]">Per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
              className="bg-black/10 border border-app-border rounded-lg px-2 py-1 text-xs text-app-text outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={pagination.page <= 1 || isLoading}
                className="p-1 rounded-lg border border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="p-1 rounded-lg border border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-app-text">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="p-1 rounded-lg border border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="p-1 rounded-lg border border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Mobile Card List View (< md) */}
        <div className="block md:hidden space-y-3 pb-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-app-panel border border-app-border rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-app-accent-text font-bold text-xs">
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PriorityColors[task.priority]}`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-app-text text-sm leading-snug">{task.title}</h4>
                {task.description && (
                  <p className="text-xs text-app-text-muted mt-1 line-clamp-2">{task.description}</p>
                )}
                {task.implementationDetails && (
                  <span className="text-[10px] text-app-accent-text/80 font-mono flex items-center gap-1 mt-1.5">
                    <FileText className="w-3 h-3" /> Has runbook / specs
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-app-border text-xs">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${StatusColors[task.status]}`}>
                  {task.status.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-app-text-muted">
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                  </span>
                  <button
                    onClick={() => setActivePostMortemTask(task)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer min-h-[32px]"
                    title="Generate Incident Post-Mortem"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop / Tablet Table View (>= md) */}
        <div className="hidden md:block bg-app-panel border border-app-border rounded-2xl overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-app-base border-b border-app-border text-app-text-muted text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th
                    onClick={() => handleSort('ticketNumber')}
                    className="px-6 py-4 w-32 cursor-pointer hover:text-app-text group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ticket</span>
                      {renderSortIcon('ticketNumber')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-6 py-4 cursor-pointer hover:text-app-text group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Title</span>
                      {renderSortIcon('title')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-6 py-4 w-32 cursor-pointer hover:text-app-text group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('priority')}
                    className="px-6 py-4 w-32 cursor-pointer hover:text-app-text group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      {renderSortIcon('priority')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('taskType')}
                    className="px-6 py-4 w-32 cursor-pointer hover:text-app-text group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type</span>
                      {renderSortIcon('taskType')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dueDate')}
                    className="px-6 py-4 w-36 cursor-pointer hover:text-app-text group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Due Date</span>
                      {renderSortIcon('dueDate')}
                    </div>
                  </th>
                  <th className="px-6 py-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-app-ui/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-app-accent-text font-bold text-xs">
                          {task.ticketNumber}
                        </span>
                        {task.isArchived && (
                          <span
                            title="Archived Task"
                            className="p-0.5 rounded bg-gray-500/20 text-gray-400"
                          >
                            <Archive className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-app-text text-sm block">{task.title}</span>
                      {task.implementationDetails && (
                        <span className="text-[10px] text-app-accent-text/80 font-mono flex items-center gap-1 mt-0.5">
                          <FileText className="w-2.5 h-2.5" /> Has runbook / implementation specs
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${StatusColors[task.status]}`}>
                        {task.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${PriorityColors[task.priority]}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${TypeColors[task.taskType]}`}>
                        {task.taskType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-app-text-muted text-xs font-mono">
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleArchiveTask(task.id)}
                          className="p-1.5 text-app-text-muted hover:text-app-text rounded-lg hover:bg-app-ui transition-colors cursor-pointer"
                          title={task.isArchived ? 'Unarchive ticket' : 'Archive ticket'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActivePostMortemTask(task)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
                          title="Generate Incident Post-Mortem & Runbook"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Post-Mortem</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
