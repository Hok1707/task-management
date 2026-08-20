import { useState } from 'react';
import { useVaultStore } from '../../stores/useVaultStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useAuditStore } from '../../stores/useAuditStore';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, CheckSquare, KeyRound, Edit2, Check, X, Copy, BarChart3, History, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaskedCredential } from '../ui/MaskedCredential';
import { EmptyState } from '../ui/EmptyState';
import { DateRangePicker } from '../tasks/DateRangePicker';
import { TaskStatus, TaskType, EnvironmentVault } from '../../types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'vault'>('tasks');
  const { viewMode, setViewMode } = useTaskStore();
  const { setAuditDrawerOpen } = useAuditStore();

  const handleNav = (tab: 'tasks' | 'vault', mode?: 'kanban' | 'list' | 'analytics') => {
    setActiveTab(tab);
    if (mode) setViewMode(mode);
    onClose?.();
  };

  const handleOpenAudit = () => {
    setAuditDrawerOpen(true);
    onClose?.();
  };

  const content = (
    <div className="flex flex-col h-full bg-app-panel text-app-text transition-colors duration-300">
      <div className="flex items-center justify-between p-5 pb-4 border-b border-app-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-app-accent rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            D
          </div>
          <div>
            <span className="text-app-text font-bold tracking-tight text-base block leading-none">DevVault.io</span>
            <span className="text-[10px] text-app-text-muted font-medium">Ops & Incident Command</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-app-text-muted hover:text-app-text hover:bg-app-ui transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-6">
        <div className="space-y-1">
          <div className="text-[10px] text-app-text-muted mb-2 font-bold uppercase tracking-widest px-2">Main Menu</div>
          <button
            onClick={() => handleNav('tasks', viewMode === 'analytics' ? 'kanban' : undefined)}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'tasks' && viewMode !== 'analytics'
                ? 'bg-app-accent/15 text-app-accent-text border border-app-accent/20 font-bold'
                : 'text-app-text-muted hover:bg-app-ui hover:text-app-text border border-transparent'
            }`}
          >
            <CheckSquare className="w-4 h-4 mr-3 shrink-0" />
            <span>Active Tasks</span>
          </button>
          <button
            onClick={() => handleNav('tasks', 'analytics')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-app-accent/15 text-app-accent-text border border-app-accent/20 font-bold'
                : 'text-app-text-muted hover:bg-app-ui hover:text-app-text border border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-3 shrink-0 text-app-accent-text" />
            <span>Analytics & Workload</span>
          </button>
          <button
            onClick={() => handleNav('vault')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-app-accent/15 text-app-accent-text border border-app-accent/20 font-bold'
                : 'text-app-text-muted hover:bg-app-ui hover:text-app-text border border-transparent'
            }`}
          >
            <KeyRound className="w-4 h-4 mr-3 shrink-0" />
            <span>Credentials Vault</span>
          </button>
          <button
            onClick={handleOpenAudit}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer text-app-text-muted hover:bg-app-ui hover:text-app-text border border-transparent"
          >
            <History className="w-4 h-4 mr-3 shrink-0" />
            <span>Audit Trail & History</span>
          </button>
        </div>

        <div className="h-px bg-app-border w-full"></div>

        <div>
          {activeTab === 'tasks' ? <TaskFilters /> : <EnvironmentList />}
        </div>
      </div>

      <div className="mt-auto p-4 m-3 bg-app-ui/50 rounded-xl border border-app-border shadow-xs">
        <div className="text-[10px] text-app-text-muted mb-1.5 font-bold uppercase tracking-widest">Active Context</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></div>
          <span className="text-xs text-app-text font-mono truncate font-semibold">STAGING-US-01</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 h-full border-r border-app-border bg-app-panel flex-col shrink-0 transition-colors duration-300">
        {content}
      </aside>

      {/* Mobile / Tablet Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50 border-r border-app-border"
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function TaskFilters() {
  const { filterStatus, setFilterStatus, filterType, setFilterType, dateFilter, clearDateFilter } = useTaskStore();

  const toggleStatus = (status: TaskStatus) => {
    if (filterStatus.includes(status)) {
      setFilterStatus(filterStatus.filter(s => s !== status));
    } else {
      setFilterStatus([...filterStatus, status]);
    }
  };

  const toggleType = (type: TaskType) => {
    if (filterType.includes(type)) {
      setFilterType(filterType.filter(t => t !== type));
    } else {
      setFilterType([...filterType, type]);
    }
  };

  const hasAnyFilters = filterStatus.length > 0 || filterType.length > 0 || Boolean(dateFilter.startDate || dateFilter.endDate);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold mb-3">Filter by Status</h3>
        <div className="space-y-1">
          <button onClick={() => toggleStatus(TaskStatus.Todo)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterStatus.includes(TaskStatus.Todo) ? 'bg-app-ui text-app-text font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <Circle className="w-3.5 h-3.5 mr-2" /> To Do
          </button>
          <button onClick={() => toggleStatus(TaskStatus.InProgress)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterStatus.includes(TaskStatus.InProgress) ? 'bg-app-ui text-app-accent-text font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> In Progress
          </button>
          <button onClick={() => toggleStatus(TaskStatus.OnHold)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterStatus.includes(TaskStatus.OnHold) ? 'bg-amber-500/10 text-amber-400 font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <AlertCircle className="w-3.5 h-3.5 mr-2" /> On Hold
          </button>
          <button onClick={() => toggleStatus(TaskStatus.Completed)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterStatus.includes(TaskStatus.Completed) ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Completed
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold mb-3">Filter by Type</h3>
        <div className="space-y-1">
          <button onClick={() => toggleType(TaskType.Incident)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterType.includes(TaskType.Incident) ? 'bg-red-500/10 text-red-400 font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <AlertCircle className="w-3.5 h-3.5 mr-2" /> Incident
          </button>
          <button onClick={() => toggleType(TaskType.Change)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterType.includes(TaskType.Change) ? 'bg-purple-500/10 text-purple-400 font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <AlertCircle className="w-3.5 h-3.5 mr-2" /> Change
          </button>
          <button onClick={() => toggleType(TaskType.Request)} className={`w-full flex items-center px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${filterType.includes(TaskType.Request) ? 'bg-teal-500/10 text-teal-400 font-medium' : 'text-app-text-muted hover:bg-app-ui/50 hover:text-app-text'}`}>
            <AlertCircle className="w-3.5 h-3.5 mr-2" /> Request
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-app-border">
        <DateRangePicker />
      </div>
      
      {hasAnyFilters && (
        <button 
          onClick={() => { setFilterStatus([]); setFilterType([]); clearDateFilter(); }}
          className="text-xs text-app-accent-text hover:underline cursor-pointer w-full text-center mt-2"
        >
          Clear All Filters
        </button>
      )}
    </motion.div>
  );
}

interface EnvironmentCardProps {
  key?: string;
  env: EnvironmentVault;
}

function EnvironmentCard({ env }: EnvironmentCardProps) {
  const { deleteEnvironment, updateEnvironment } = useVaultStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showEditSecret, setShowEditSecret] = useState(false);
  const [editForm, setEditForm] = useState(env);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);

  const handleSave = () => {
    updateEnvironment(env.id, editForm);
    setIsEditing(false);
    setShowEditSecret(false);
  };

  const handleCancel = () => {
    setEditForm(env);
    setIsEditing(false);
    setShowEditSecret(false);
  };

  if (isEditing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-app-ui border border-app-border rounded-xl p-4 shadow-md space-y-3"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-app-text">Edit Environment</span>
          <div className="flex items-center gap-1">
            <button onClick={handleSave} className="p-1 rounded text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer" title="Save">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCancel} className="p-1 rounded text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer" title="Cancel">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">Name</label>
          <input 
            value={editForm.envName} 
            onChange={(e) => setEditForm({...editForm, envName: e.target.value})}
            className="w-full bg-black/10 border border-app-border rounded px-2 py-1 text-xs text-app-text outline-none focus:border-app-accent" 
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">Base URL</label>
          <input 
            value={editForm.baseUrl} 
            onChange={(e) => setEditForm({...editForm, baseUrl: e.target.value})}
            className="w-full bg-black/10 border border-app-border rounded px-2 py-1 text-[10px] font-mono text-app-text outline-none focus:border-app-accent" 
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">Username</label>
          <input 
            value={editForm.username} 
            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
            className="w-full bg-black/10 border border-app-border rounded px-2 py-1 text-[10px] font-mono text-app-text outline-none focus:border-app-accent" 
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">Secret Key</label>
          <div className="relative">
            <input 
              value={editForm.secretKey} 
              onChange={(e) => setEditForm({...editForm, secretKey: e.target.value})}
              type={showEditSecret ? "text" : "password"}
              className="w-full bg-black/10 border border-app-border rounded px-2 py-1 pr-7 text-[10px] font-mono text-app-text outline-none focus:border-app-accent" 
            />
            <button
              type="button"
              onClick={() => setShowEditSecret(!showEditSecret)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text cursor-pointer p-0.5"
              title={showEditSecret ? "Hide secret" : "Show secret"}
            >
              {showEditSecret ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-app-text-muted" />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const copyToClipboard = (text: string, type: 'url' | 'user') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') setCopiedUrl(true);
    if (type === 'user') setCopiedUser(true);
    setTimeout(() => {
      setCopiedUrl(false);
      setCopiedUser(false);
    }, 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-black/5 border border-app-border rounded-xl p-4 hover:border-app-border-hover transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xs text-app-text">{env.envName}</h3>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="text-app-text-muted hover:text-app-text cursor-pointer p-1.5 rounded hover:bg-app-ui min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Edit Environment"
            aria-label="Edit Environment"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteEnvironment(env.id)}
            className="text-app-text-muted hover:text-red-500 cursor-pointer p-1.5 rounded hover:bg-red-500/10 min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Delete Environment"
            aria-label="Delete Environment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-[10px] text-app-text-muted font-mono truncate bg-black/10 rounded p-1.5 border border-app-border select-none">
            {env.baseUrl}
          </div>
          <button
            onClick={() => copyToClipboard(env.baseUrl, 'url')}
            className="p-1.5 text-app-text-muted hover:text-app-text transition-colors bg-app-ui rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Copy URL"
            aria-label="Copy URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {env.username && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 text-[10px] text-app-text-muted font-mono truncate bg-black/10 rounded p-1.5 border border-app-border select-none">
              {env.username}
            </div>
            <button
              onClick={() => copyToClipboard(env.username, 'user')}
              className="p-1.5 text-app-text-muted hover:text-app-text transition-colors bg-app-ui rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
              title="Copy Username"
              aria-label="Copy Username"
            >
              {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <MaskedCredential value={env.secretKey} envName={env.envName} />
      </div>
    </motion.div>
  );
}

function EnvironmentList() {
  const { environments, addEnvironment, loadDemoEnvironments } = useVaultStore();

  const handleAddEnv = () => {
    addEnvironment({
      envName: 'New Environment',
      baseUrl: 'https://',
      username: '',
      secretKey: '',
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold">Environments</h3>
        <button
          onClick={handleAddEnv}
          className="text-app-text-muted hover:text-app-accent-text transition-colors cursor-pointer"
          title="Add New Environment"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {environments.length === 0 ? (
        <EmptyState
          compact
          icon={KeyRound}
          title="Vault is Empty"
          description="Securely store host URLs and credentials per environment."
          primaryAction={{
            label: 'Add Environment',
            onClick: handleAddEnv,
            icon: Plus,
          }}
          secondaryAction={{
            label: 'Restore Demo Vault',
            onClick: loadDemoEnvironments,
            icon: RotateCcw,
          }}
        />
      ) : (
        <AnimatePresence>
          {environments.map((env) => (
            <EnvironmentCard key={env.id} env={env} />
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
