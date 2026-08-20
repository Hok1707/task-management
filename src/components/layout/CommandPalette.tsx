import { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useVaultStore } from '../../stores/useVaultStore';
import { TaskStatus, TaskType } from '../../types';
import { Plus, Search, Server, CheckCircle2 } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { setFilterStatus, setFilterType, setViewMode, setCreateModalOpen } = useTaskStore();
  const { environments } = useVaultStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm transition-colors duration-300" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-xl bg-app-panel rounded-xl shadow-2xl border border-app-border overflow-hidden transition-colors duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-app-border">
          <Search className="w-5 h-5 text-app-text-muted mr-3" />
          <input 
            type="text" 
            placeholder="Type a command or search..." 
            className="flex-1 bg-transparent border-none outline-none text-app-text placeholder-app-text-muted text-sm"
            autoFocus
          />
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-app-text-muted">
            Actions
          </div>
          <button onClick={() => runCommand(() => setCreateModalOpen(true))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors group">
            <Plus className="mr-3 h-4 w-4 text-app-text-muted group-hover:text-app-accent-text" />
            Create New Task
          </button>
          <button onClick={() => runCommand(() => setViewMode('kanban'))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors group">
            <Search className="mr-3 h-4 w-4 text-app-text-muted group-hover:text-app-accent-text" />
            Switch to Kanban View
          </button>
          <button onClick={() => runCommand(() => setViewMode('list'))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors group">
            <Search className="mr-3 h-4 w-4 text-app-text-muted group-hover:text-app-accent-text" />
            Switch to List View
          </button>

          <div className="px-3 py-2 mt-2 text-xs font-bold uppercase tracking-wider text-app-text-muted">
            Filters
          </div>
          <button onClick={() => runCommand(() => setFilterStatus([TaskStatus.InProgress]))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors">
            <CheckCircle2 className="mr-3 h-4 w-4 text-app-accent-text" />
            View In Progress
          </button>
          <button onClick={() => runCommand(() => setFilterStatus([TaskStatus.Todo]))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors">
            <CheckCircle2 className="mr-3 h-4 w-4 text-app-text-muted" />
            View To Do
          </button>
          <button onClick={() => runCommand(() => setFilterType([TaskType.Incident]))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors">
            <CheckCircle2 className="mr-3 h-4 w-4 text-red-400" />
            View Incidents
          </button>

          <div className="px-3 py-2 mt-2 text-xs font-bold uppercase tracking-wider text-app-text-muted">
            Environments
          </div>
          {environments.map((env) => (
            <button key={env.id} onClick={() => runCommand(() => console.log('Switch env to', env.id))} className="w-full flex items-center px-3 py-2 text-sm text-app-text hover:bg-app-ui rounded-md transition-colors group">
              <Server className="mr-3 h-4 w-4 text-app-text-muted group-hover:text-emerald-500" />
              Switch to {env.envName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
