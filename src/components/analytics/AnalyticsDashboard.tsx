import { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { TaskStatus, TaskAnalyticsData } from '../../types';
import { taskApi } from '../../services/taskApi';
import { EmptyState } from '../ui/EmptyState';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Flame,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  Plus,
  RotateCcw,
  ShieldAlert,
  BarChart3,
  Loader2,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  [TaskStatus.Todo]: '#64748b',
  [TaskStatus.InProgress]: '#3b82f6',
  [TaskStatus.OnHold]: '#f59e0b',
  [TaskStatus.Completed]: '#10b981',
};

export function AnalyticsDashboard() {
  const { setCreateModalOpen, loadDemoTasks, addTemplateTask } = useTaskStore();
  const [data, setData] = useState<TaskAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const json = await taskApi.getAnalytics();
      setData(json);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 gap-3 text-app-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-app-accent-text" />
        <span className="text-xs font-mono">Aggregating server-side metrics & distributions...</span>
      </div>
    );
  }

  const totalTasks = data?.totalTasks || 0;

  if (totalTasks === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <EmptyState
          icon={BarChart3}
          badge="Analytics Engine"
          title="No data to analyze"
          description="Create operational tasks or load a demo workload to visualize status distributions, priority bottlenecks, and resolution velocity."
          primaryAction={{
            label: 'Create First Task',
            onClick: () => setCreateModalOpen(true),
            icon: Plus,
          }}
          secondaryAction={{
            label: 'Load Demo Workload',
            onClick: async () => {
              await loadDemoTasks();
              fetchAnalytics();
            },
            icon: RotateCcw,
          }}
          quickTemplates={[
            {
              label: 'Production Incident (INC)',
              onClick: async () => {
                await addTemplateTask('incident');
                fetchAnalytics();
              },
              icon: ShieldAlert,
            },
            {
              label: 'Database Upgrade (CHG)',
              onClick: async () => {
                await addTemplateTask('change');
                fetchAnalytics();
              },
              icon: Sparkles,
            },
            {
              label: 'Developer Cache (REQ)',
              onClick: async () => {
                await addTemplateTask('request');
                fetchAnalytics();
              },
              icon: Layers,
            },
          ]}
        />
      </div>
    );
  }

  const completedTasks = data?.completedTasks || 0;
  const inProgressTasks = data?.inProgressTasks || 0;
  const criticalTasks = data?.criticalTasks || 0;
  const completionRate = data?.completionRate || 0;
  const statusData = data?.statusDistribution || [];
  const priorityData = data?.priorityDistribution || [];
  const typeStatusData = data?.typeStatusBreakdown || [];
  const overdueTasks = data?.overdueTasksCount || 0;

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-1 pb-8">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-app-panel border border-app-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-app-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
            <Layers className="w-4 h-4 text-app-accent-text" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-app-text font-mono">{totalTasks}</span>
            <span className="text-xs text-app-text-muted">server database</span>
          </div>
        </div>

        <div className="bg-app-panel border border-app-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-app-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400 font-mono">{inProgressTasks}</span>
            <span className="text-xs text-app-text-muted">active workload</span>
          </div>
        </div>

        <div className="bg-app-panel border border-app-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-app-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Pending</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400 font-mono">{criticalTasks}</span>
            <span className="text-xs text-app-text-muted">urgent attention</span>
          </div>
        </div>

        <div className="bg-app-panel border border-app-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-app-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{completionRate}%</span>
            <span className="text-xs text-app-text-muted">{completedTasks}/{totalTasks} done</span>
          </div>
        </div>
      </div>

      {/* Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-app-panel border border-app-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-app-text">Status Distribution</h3>
              <p className="text-xs text-app-text-muted">Aggregated across all records in database</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-app-text-muted bg-app-ui px-2 py-1 rounded">
              <Clock className="w-3 h-3 text-app-accent-text" />
              <span>Server-Computed</span>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 20, 25, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-app-text">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-app-text-muted">No task data available</p>
            )}
          </div>
        </div>

        {/* Priority Distribution Bar Chart */}
        <div className="bg-app-panel border border-app-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-app-text">Priority Breakdown</h3>
              <p className="text-xs text-app-text-muted">Task volume sorted by severity tier</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-app-text-muted bg-app-ui px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span>Severity</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 25, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Type Matrix Stacked Bar Chart */}
        <div className="bg-app-panel border border-app-border rounded-2xl p-6 shadow-sm flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-app-text">Type vs. Status Distribution</h3>
              <p className="text-xs text-app-text-muted">Incident, Change, and Request distribution across development stages</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-app-text-muted bg-app-ui px-2 py-1 rounded">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Matrix</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 25, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-app-text">{value}</span>}
                />
                <Bar dataKey="Todo" stackId="a" fill={STATUS_COLORS[TaskStatus.Todo]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="InProgress" stackId="a" fill={STATUS_COLORS[TaskStatus.InProgress]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="OnHold" stackId="a" fill={STATUS_COLORS[TaskStatus.OnHold]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Completed" stackId="a" fill={STATUS_COLORS[TaskStatus.Completed]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Insights & Health Recommendations */}
      <div className="bg-app-panel border border-app-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-app-text mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-app-accent-text" />
          Workload Health & Developer Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/5 border border-app-border rounded-xl p-4">
            <div className="text-xs font-bold text-app-text mb-1">Critical Priority Focus</div>
            <p className="text-xs text-app-text-muted leading-relaxed">
              {criticalTasks > 0
                ? `${criticalTasks} critical priority task${criticalTasks > 1 ? 's' : ''} require immediate resolution to unblock staging/production.`
                : 'No critical tickets pending. Pipeline is clear for scheduled roadmap work.'}
            </p>
          </div>

          <div className="bg-black/5 border border-app-border rounded-xl p-4">
            <div className="text-xs font-bold text-app-text mb-1">Overdue Deadlines</div>
            <p className="text-xs text-app-text-muted leading-relaxed">
              {overdueTasks > 0
                ? `${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} past due date. Consider updating estimates or reassigning bandwidth.`
                : 'All tasks are on track with scheduled due dates.'}
            </p>
          </div>

          <div className="bg-black/5 border border-app-border rounded-xl p-4">
            <div className="text-xs font-bold text-app-text mb-1">Throughput Velocity</div>
            <p className="text-xs text-app-text-muted leading-relaxed">
              {completionRate >= 50
                ? `Strong sprint velocity with ${completionRate}% tasks resolved across the active workspace.`
                : `Current resolution rate is ${completionRate}%. Focus on transitioning active tasks in progress.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
