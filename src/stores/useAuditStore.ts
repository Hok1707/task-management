import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditLog, AuditLogAction, AuditLogSeverity, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AuditState {
  logs: AuditLog[];
  addLog: (
    action: AuditLogAction,
    target: string,
    details: string,
    severity?: AuditLogSeverity,
    actor?: string
  ) => void;
  clearLogs: () => void;
  isAuditDrawerOpen: boolean;
  setAuditDrawerOpen: (open: boolean) => void;
  activePostMortemTask: Task | null;
  setActivePostMortemTask: (task: Task | null) => void;
}

const initialLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    action: 'task_status_changed',
    target: 'INC-1024',
    details: 'Status transitioned from Todo to In Progress',
    actor: 'Alex Rivera',
    severity: 'warning',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    action: 'vault_revealed',
    target: 'Production-01',
    details: 'Secret key unmasked for staging deployment check',
    actor: 'Alex Rivera',
    severity: 'critical',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    action: 'task_created',
    target: 'INC-1024',
    details: 'Created Incident: Fix authentication flow in production',
    actor: 'Jane Doe',
    severity: 'info',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    action: 'vault_created',
    target: 'Staging',
    details: 'Added new environment credentials vault endpoint',
    actor: 'Alex Rivera',
    severity: 'info',
  },
];

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      logs: initialLogs,
      addLog: (action, target, details, severity = 'info', actor = 'Alex Rivera') =>
        set((state) => ({
          logs: [
            {
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              action,
              target,
              details,
              actor,
              severity,
            },
            ...state.logs,
          ],
        })),
      clearLogs: () => set({ logs: [] }),
      isAuditDrawerOpen: false,
      setAuditDrawerOpen: (open) => set({ isAuditDrawerOpen: open }),
      activePostMortemTask: null,
      setActivePostMortemTask: (task) => set({ activePostMortemTask: task }),
    }),
    {
      name: 'audit-storage',
    }
  )
);
