import { useState } from 'react';
import { useAuditStore } from '../../stores/useAuditStore';
import { AuditLogSeverity } from '../../types';
import {
  X,
  History,
  ShieldAlert,
  Search,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  KeyRound,
  FileText,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function AuditTrailDrawer() {
  const { logs, clearLogs, isAuditDrawerOpen, setAuditDrawerOpen } = useAuditStore();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | AuditLogSeverity>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tasks' | 'vault' | 'postmortem'>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    let matchesCategory = true;
    if (categoryFilter === 'tasks') {
      matchesCategory = log.action.startsWith('task_');
    } else if (categoryFilter === 'vault') {
      matchesCategory = log.action.startsWith('vault_');
    } else if (categoryFilter === 'postmortem') {
      matchesCategory = log.action.includes('postmortem');
    }

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith('vault_')) return <KeyRound className="w-3.5 h-3.5 text-amber-400" />;
    if (action.includes('postmortem')) return <FileText className="w-3.5 h-3.5 text-purple-400" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-app-accent-text" />;
  };

  const getSeverityBadge = (severity: AuditLogSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-2.5 h-2.5" /> CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-2.5 h-2.5" /> WARNING
          </span>
        );
      case 'info':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Info className="w-2.5 h-2.5" /> INFO
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isAuditDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuditDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-app-panel border-l border-app-border shadow-2xl flex flex-col transition-colors duration-300 text-app-text"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-app-border bg-app-ui/30 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-app-accent/15 border border-app-accent/20 flex items-center justify-center text-app-accent-text shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-app-text truncate">Audit Trail & Activity Log</h2>
                  <p className="text-[11px] text-app-text-muted truncate">
                    Security & workflow ledger
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleExportJSON}
                  className="p-2 text-app-text-muted hover:text-app-text rounded-lg hover:bg-app-ui transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Export Audit Log JSON"
                  aria-label="Export JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-2 text-app-text-muted hover:text-red-400 rounded-lg hover:bg-app-ui transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Clear All Logs"
                  aria-label="Clear logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAuditDrawerOpen(false)}
                  className="p-2 text-app-text-muted hover:text-app-text rounded-lg hover:bg-app-ui transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-app-border space-y-3 bg-black/5 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-app-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ticket, target, actor, or detail..."
                  className="w-full bg-black/10 border border-app-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-app-text outline-none focus:border-app-accent min-h-[36px]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Category Pills */}
                <div className="flex items-center bg-black/10 rounded-lg p-0.5 border border-app-border text-[11px] overflow-x-auto">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-app-ui text-app-text font-bold shadow-sm'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCategoryFilter('tasks')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      categoryFilter === 'tasks'
                        ? 'bg-app-ui text-app-text font-bold shadow-sm'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setCategoryFilter('vault')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      categoryFilter === 'vault'
                        ? 'bg-app-ui text-app-text font-bold shadow-sm'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    Vault
                  </button>
                  <button
                    onClick={() => setCategoryFilter('postmortem')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      categoryFilter === 'postmortem'
                        ? 'bg-app-ui text-app-text font-bold shadow-sm'
                        : 'text-app-text-muted hover:text-app-text'
                    }`}
                  >
                    Incidents
                  </button>
                </div>

                {/* Severity Dropdown / Filter */}
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  className="bg-black/10 border border-app-border text-[11px] rounded-lg px-2.5 py-1 text-app-text outline-none cursor-pointer min-h-[30px]"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-app-text-muted text-xs py-16">
                  <History className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No audit log records match the current filter.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-black/5 border border-app-border hover:border-app-border-hover transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-mono font-bold text-app-accent-text">
                          {log.target}
                        </span>
                      </div>
                      {getSeverityBadge(log.severity)}
                    </div>

                    <p className="text-app-text leading-snug">{log.details}</p>

                    <div className="flex items-center justify-between text-[10px] text-app-text-muted pt-2 border-t border-app-border">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{log.actor}</span>
                      </div>
                      <span className="font-mono">
                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
