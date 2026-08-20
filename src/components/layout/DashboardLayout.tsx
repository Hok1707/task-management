import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useAuditStore } from '../../stores/useAuditStore';
import { Sidebar } from './Sidebar';
import { KanbanBoard } from '../tasks/KanbanBoard';
import { TaskListView } from '../tasks/TaskListView';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { PostMortemModal } from '../incidents/PostMortemModal';
import { AuditTrailDrawer } from '../audit/AuditTrailDrawer';
import { CommandPalette } from './CommandPalette';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { QuickNotesPanel } from '../notes/QuickNotesPanel';
import { DateRangePicker } from '../tasks/DateRangePicker';
import { Search, LayoutGrid, List, BarChart3, Bell, Plus, StickyNote, History, Menu, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    setCreateModalOpen,
    quickFilter,
    setQuickFilter,
    fetchTasks,
  } = useTaskStore();
  const { isNotesPanelOpen, setNotesPanelOpen } = useNotesStore();
  const { logs, isAuditDrawerOpen, setAuditDrawerOpen } = useAuditStore();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search or open command palette
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex bg-app-base overflow-hidden text-app-text font-sans transition-colors duration-300">
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        <CommandPalette />
        <CreateTaskModal />
        <QuickNotesPanel />
        <PostMortemModal />
        <AuditTrailDrawer />
        
        {/* Top Navigation */}
        <header className="relative z-40 h-16 border-b border-app-border bg-app-panel/70 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 transition-colors duration-300 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-app-text-muted hover:text-app-text hover:bg-app-ui transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input */}
            <div className="relative flex-1 max-w-sm flex items-center gap-2 bg-black/5 border border-app-border rounded-lg px-2.5 sm:px-3 py-1.5 opacity-90 hover:opacity-100 focus-within:border-app-accent focus-within:ring-1 focus-within:ring-app-accent transition-all min-h-[40px]">
              <Search className="w-4 h-4 text-app-text-muted shrink-0" />
              <input
                id="global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets, runs..."
                className="w-full bg-transparent border-none text-xs transition-all outline-none text-app-text placeholder-app-text-muted"
              />
              <div className="hidden sm:inline-block text-[10px] bg-app-ui px-1.5 py-0.5 rounded text-app-text-muted font-mono shrink-0">
                ⌘K
              </div>
            </div>

            {/* Quick Add Task Button */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent hover:bg-app-accent-hover text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 min-h-[40px]"
              title="Create New Operational Task"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>

          {/* Header Controls & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Audit Log Trigger */}
              <button
                onClick={() => setAuditDrawerOpen(!isAuditDrawerOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer min-h-[38px] ${
                  isAuditDrawerOpen
                    ? 'bg-app-accent text-white border-app-accent shadow-xs'
                    : 'border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui'
                }`}
                title="Toggle Audit Trail & Activity History"
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Audit Log</span>
                {logs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-app-accent-text/20 rounded-full font-mono font-bold">
                    {logs.length}
                  </span>
                )}
              </button>

              {/* Quick Notes Trigger */}
              <button
                onClick={() => setNotesPanelOpen(!isNotesPanelOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer min-h-[38px] ${
                  isNotesPanelOpen
                    ? 'bg-app-accent text-white border-app-accent shadow-xs'
                    : 'border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui'
                }`}
                title="Toggle Scratchpad & Quick Notes"
              >
                <StickyNote className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Notes</span>
              </button>

              {/* Theme Switcher */}
              <ThemeSwitcher />
            </div>

            <div className="h-6 w-px bg-app-border hidden sm:block"></div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-black/5 rounded-lg p-1 border border-app-border shrink-0">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  viewMode === 'kanban' ? 'bg-app-ui shadow-xs text-app-text font-bold' : 'text-app-text-muted hover:text-app-text'
                }`}
                title="Kanban Board View"
                aria-label="Kanban View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  viewMode === 'list' ? 'bg-app-ui shadow-xs text-app-text font-bold' : 'text-app-text-muted hover:text-app-text'
                }`}
                title="Task List Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  viewMode === 'analytics' ? 'bg-app-ui shadow-xs text-app-accent-text font-bold' : 'text-app-text-muted hover:text-app-text'
                }`}
                title="Analytics & Workload Insights"
                aria-label="Analytics View"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 ml-1">
              <div className="text-right hidden xl:block">
                <div className="text-xs font-semibold text-app-text leading-tight">{user?.username || 'Alex Rivera'}</div>
                <div className="text-[10px] text-app-accent-text font-medium leading-tight">Senior Engineer</div>
              </div>
              <button
                onClick={handleLogout}
                title="Click to sign out"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-app-accent to-purple-500 border border-app-border cursor-pointer shrink-0 hover:ring-2 hover:ring-app-accent/40 transition-all flex items-center justify-center text-white font-bold text-xs"
              >
                {(user?.username?.[0] || 'A').toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto relative p-3 sm:p-5 lg:p-6 flex flex-col min-h-0">
          {viewMode !== 'analytics' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Quick Status Filters */}
                <div className="flex items-center bg-black/5 rounded-lg p-1 border border-app-border shrink-0">
                  <button
                    onClick={() => setQuickFilter('all')}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer min-h-[32px] ${
                      quickFilter === 'all'
                        ? 'bg-app-ui shadow-xs text-app-text'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setQuickFilter('active')}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer min-h-[32px] ${
                      quickFilter === 'active'
                        ? 'bg-app-ui shadow-xs text-app-text'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setQuickFilter('completed')}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer min-h-[32px] ${
                      quickFilter === 'completed'
                        ? 'bg-app-ui shadow-xs text-app-text'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    Completed
                  </button>
                </div>

                {/* Date Range Picker */}
                <DateRangePicker compact />
              </div>

              {/* Mobile Sidebar & Vault Trigger Button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden self-start sm:self-auto flex items-center gap-1.5 text-xs text-app-accent-text font-semibold bg-app-accent/10 border border-app-accent/20 px-3 py-1.5 rounded-lg hover:bg-app-accent/20 transition-all cursor-pointer min-h-[36px]"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters & Vault</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {viewMode === 'kanban' && <KanbanBoard />}
            {viewMode === 'list' && <TaskListView />}
            {viewMode === 'analytics' && <AnalyticsDashboard />}
          </div>
        </div>
      </main>
    </div>
  );
}
