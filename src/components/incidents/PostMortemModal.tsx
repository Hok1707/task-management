import React, { useState, useEffect } from 'react';
import { useAuditStore } from '../../stores/useAuditStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Task, PostMortemData, PostMortemTimelineItem, PostMortemActionItem } from '../../types';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Clock,
  ShieldAlert,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Code,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function PostMortemModal() {
  const { activePostMortemTask, setActivePostMortemTask, addLog } = useAuditStore();
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<PostMortemData | null>(null);

  useEffect(() => {
    if (activePostMortemTask) {
      const initialDate = activePostMortemTask.startDate
        ? activePostMortemTask.startDate.split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        ticketNumber: activePostMortemTask.ticketNumber,
        title: activePostMortemTask.title,
        incidentLead: activePostMortemTask.assignedFrom || user?.username || 'Alex Rivera',
        severity: activePostMortemTask.priority,
        taskType: activePostMortemTask.taskType,
        incidentDate: initialDate,
        duration: '45 mins (TTR)',
        impactedServices: 'Production API Gateway, Auth SSO, User Session DB',
        summary:
          activePostMortemTask.description ||
          'Production outage affected authentication endpoints causing 500 error responses.',
        rootCause:
          'Token renewal race condition triggered unhandled promise rejection in auth middleware during high concurrency load.',
        timeline: [
          {
            id: 't-1',
            time: '14:02 UTC',
            event: 'Automated Datadog alerts fired for high 5xx error rate on /auth/login.',
          },
          {
            id: 't-2',
            time: '14:10 UTC',
            event: 'Incident triage started; on-call engineer confirmed SSO failure.',
          },
          {
            id: 't-3',
            time: '14:35 UTC',
            event: 'Rollback to build v2.4.1 applied on staging/production ingress.',
          },
          {
            id: 't-4',
            time: '14:47 UTC',
            event: 'Error rates dropped to 0%. Authentication fully restored.',
          },
        ],
        actionItems: [
          {
            id: 'a-1',
            action: 'Add mutex lock to token renewal handler in Auth service',
            owner: activePostMortemTask.assignedFrom || 'Alex Rivera',
            status: 'done',
          },
          {
            id: 'a-2',
            action: 'Implement synthetic health check ping for SSO renewal endpoint',
            owner: 'DevOps Lead',
            status: 'open',
          },
          {
            id: 'a-3',
            action: 'Update runbook documentation with rollback checklist',
            owner: 'Alex Rivera',
            status: 'open',
          },
        ],
        runbookSteps:
          activePostMortemTask.implementationDetails ||
          '1. Verify cluster health: `kubectl get pods -n auth-prod`\n2. Inspect logs: `kubectl logs -l app=auth-service --tail=200`\n3. Execute rollback if needed: `helm rollback auth-prod 41`\n4. Validate endpoint: `curl -I https://api.prod.example.com/api/health`',
      });
    }
  }, [activePostMortemTask, user]);

  if (!activePostMortemTask || !formData) return null;

  const generateMarkdown = (): string => {
    return `# INCIDENT POST-MORTEM REPORT: [${formData.ticketNumber}] ${formData.title}

| Metadata | Details |
| :--- | :--- |
| **Ticket Reference** | \`${formData.ticketNumber}\` (${formData.taskType}) |
| **Severity Tier** | **${formData.severity}** |
| **Incident Lead** | ${formData.incidentLead} |
| **Incident Date** | ${formData.incidentDate} |
| **Time to Resolution (TTR)** | ${formData.duration} |
| **Impacted Services** | ${formData.impactedServices} |

---

## 1. Executive Summary
${formData.summary}

---

## 2. Root Cause Analysis
${formData.rootCause}

---

## 3. Incident Timeline
${formData.timeline.map((item) => `- **${item.time}**: ${item.event}`).join('\n')}

---

## 4. Corrective & Preventative Action Items
| Status | Action Item | Owner |
| :---: | :--- | :--- |
${formData.actionItems.map((item) => `| ${item.status === 'done' ? '✅ DONE' : '⏳ OPEN'} | ${item.action} | ${item.owner} |`).join('\n')}

---

## 5. Runbook & Verification Steps
\`\`\`bash
${formData.runbookSteps}
\`\`\`

---
*Report generated via DevVault.io Incident Management System on ${format(new Date(), 'PPpp')}*
`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    addLog(
      'postmortem_generated',
      formData.ticketNumber,
      `Exported Incident Post-Mortem & Runbook markdown for ${formData.ticketNumber}`,
      'info'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POSTMORTEM-${formData.ticketNumber}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(
      'postmortem_generated',
      formData.ticketNumber,
      `Downloaded POSTMORTEM-${formData.ticketNumber}.md report`,
      'info'
    );
  };

  const handleAddTimelineItem = () => {
    setFormData({
      ...formData,
      timeline: [
        ...formData.timeline,
        {
          id: `t-${Date.now()}`,
          time: `${format(new Date(), 'HH:mm')} UTC`,
          event: 'New milestone description...',
        },
      ],
    });
  };

  const handleRemoveTimelineItem = (id: string) => {
    setFormData({
      ...formData,
      timeline: formData.timeline.filter((item) => item.id !== id),
    });
  };

  const handleAddActionItem = () => {
    setFormData({
      ...formData,
      actionItems: [
        ...formData.actionItems,
        {
          id: `a-${Date.now()}`,
          action: 'New remediation action item',
          owner: formData.incidentLead,
          status: 'open',
        },
      ],
    });
  };

  const handleRemoveActionItem = (id: string) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems.filter((item) => item.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-app-panel border border-app-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-app-text transition-colors duration-300"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-app-border bg-app-ui/40 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-app-accent-text">
                  {formData.ticketNumber}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">
                  Incident Post-Mortem
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-app-text truncate max-w-sm sm:max-w-md">
                {formData.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-black/10 rounded-lg p-0.5 sm:p-1 border border-app-border text-xs">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer min-h-[30px] ${
                  viewMode === 'preview' ? 'bg-app-ui text-app-text font-bold shadow-xs' : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs">Preview</span>
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer min-h-[30px] ${
                  viewMode === 'editor' ? 'bg-app-ui text-app-text font-bold shadow-xs' : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-xs">Edit</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer min-h-[30px] ${
                  viewMode === 'raw' ? 'bg-app-ui text-app-text font-bold shadow-xs' : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span className="text-xs">Raw</span>
              </button>
            </div>

            <button
              onClick={() => setActivePostMortemTask(null)}
              className="p-1.5 text-app-text-muted hover:text-app-text rounded-lg hover:bg-app-ui transition-colors cursor-pointer ml-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {viewMode === 'preview' && (
            <div className="space-y-6">
              {/* Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-black/5 border border-app-border text-xs">
                <div>
                  <div className="text-[10px] text-app-text-muted uppercase font-bold">Severity</div>
                  <div className="font-bold text-red-400">{formData.severity}</div>
                </div>
                <div>
                  <div className="text-[10px] text-app-text-muted uppercase font-bold">Incident Lead</div>
                  <div className="font-medium text-app-text">{formData.incidentLead}</div>
                </div>
                <div>
                  <div className="text-[10px] text-app-text-muted uppercase font-bold">Incident Date</div>
                  <div className="font-medium text-app-text">{formData.incidentDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-app-text-muted uppercase font-bold">Duration (TTR)</div>
                  <div className="font-medium text-amber-400">{formData.duration}</div>
                </div>
                <div className="col-span-2 sm:col-span-4 mt-2 pt-2 border-t border-app-border">
                  <div className="text-[10px] text-app-text-muted uppercase font-bold">Impacted Services</div>
                  <div className="font-mono text-xs text-app-text">{formData.impactedServices}</div>
                </div>
              </div>

              {/* Section 1: Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-app-accent-text flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  1. Executive Summary & Impact
                </h3>
                <p className="text-xs text-app-text leading-relaxed bg-black/5 p-3 rounded-lg border border-app-border">
                  {formData.summary}
                </p>
              </div>

              {/* Section 2: Root Cause */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  2. Root Cause Analysis
                </h3>
                <p className="text-xs text-app-text leading-relaxed bg-black/5 p-3 rounded-lg border border-app-border">
                  {formData.rootCause}
                </p>
              </div>

              {/* Section 3: Timeline */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-app-accent-text flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  3. Incident Timeline
                </h3>
                <div className="space-y-2 border-l-2 border-app-accent/30 pl-4 ml-1">
                  {formData.timeline.map((item) => (
                    <div key={item.id} className="text-xs relative">
                      <div className="w-2 h-2 rounded-full bg-app-accent absolute -left-[21px] top-1"></div>
                      <span className="font-mono font-bold text-app-accent-text mr-2">{item.time}</span>
                      <span className="text-app-text">{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Action Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  4. Preventative Action Items
                </h3>
                <div className="overflow-hidden border border-app-border rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-black/10 border-b border-app-border text-[10px] uppercase font-bold text-app-text-muted">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Action Item</th>
                        <th className="p-2.5">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border">
                      {formData.actionItems.map((item) => (
                        <tr key={item.id} className="hover:bg-app-ui/30">
                          <td className="p-2.5 font-bold">
                            {item.status === 'done' ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> DONE
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> OPEN
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-app-text">{item.action}</td>
                          <td className="p-2.5 text-app-text-muted">{item.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Runbook */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  5. Runbook & Verification Steps
                </h3>
                <pre className="p-3 bg-black/20 rounded-lg text-xs font-mono text-emerald-300 border border-app-border overflow-x-auto whitespace-pre-wrap">
                  {formData.runbookSteps}
                </pre>
              </div>
            </div>
          )}

          {viewMode === 'editor' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-app-text-muted mb-1">
                    Incident Lead
                  </label>
                  <input
                    type="text"
                    value={formData.incidentLead}
                    onChange={(e) => setFormData({ ...formData, incidentLead: e.target.value })}
                    className="w-full bg-black/10 border border-app-border rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-app-text-muted mb-1">
                    Incident Date
                  </label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="w-full bg-black/10 border border-app-border rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-app-text-muted mb-1">
                    Time to Resolution (TTR)
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-black/10 border border-app-border rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-app-text-muted mb-1">
                  Impacted Services & Architecture
                </label>
                <input
                  type="text"
                  value={formData.impactedServices}
                  onChange={(e) => setFormData({ ...formData, impactedServices: e.target.value })}
                  className="w-full bg-black/10 border border-app-border rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-app-text-muted mb-1">
                  Executive Summary
                </label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full bg-black/10 border border-app-border rounded-lg p-3 text-xs text-app-text outline-none focus:border-app-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-app-text-muted mb-1">
                  Root Cause Analysis (5 Whys)
                </label>
                <textarea
                  rows={3}
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  className="w-full bg-black/10 border border-app-border rounded-lg p-3 text-xs text-app-text outline-none focus:border-app-accent"
                />
              </div>

              {/* Timeline Items Editor */}
              <div className="space-y-2 pt-2 border-t border-app-border">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-app-text-muted">
                    Timeline Milestones
                  </label>
                  <button
                    onClick={handleAddTimelineItem}
                    className="flex items-center gap-1 text-[11px] text-app-accent-text hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Milestone
                  </button>
                </div>
                {formData.timeline.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.time}
                      onChange={(e) => {
                        const updated = [...formData.timeline];
                        updated[idx].time = e.target.value;
                        setFormData({ ...formData, timeline: updated });
                      }}
                      className="w-28 bg-black/10 border border-app-border rounded-lg px-2 py-1 text-xs font-mono text-app-text outline-none"
                    />
                    <input
                      type="text"
                      value={item.event}
                      onChange={(e) => {
                        const updated = [...formData.timeline];
                        updated[idx].event = e.target.value;
                        setFormData({ ...formData, timeline: updated });
                      }}
                      className="flex-1 bg-black/10 border border-app-border rounded-lg px-3 py-1 text-xs text-app-text outline-none"
                    />
                    <button
                      onClick={() => handleRemoveTimelineItem(item.id)}
                      className="p-1 text-app-text-muted hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Items Editor */}
              <div className="space-y-2 pt-2 border-t border-app-border">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-app-text-muted">
                    Preventative Action Items
                  </label>
                  <button
                    onClick={handleAddActionItem}
                    className="flex items-center gap-1 text-[11px] text-app-accent-text hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Action Item
                  </button>
                </div>
                {formData.actionItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = [...formData.actionItems];
                        updated[idx].status = updated[idx].status === 'done' ? 'open' : 'done';
                        setFormData({ ...formData, actionItems: updated });
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                        item.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </button>
                    <input
                      type="text"
                      value={item.action}
                      onChange={(e) => {
                        const updated = [...formData.actionItems];
                        updated[idx].action = e.target.value;
                        setFormData({ ...formData, actionItems: updated });
                      }}
                      className="flex-1 bg-black/10 border border-app-border rounded-lg px-3 py-1 text-xs text-app-text outline-none"
                    />
                    <input
                      type="text"
                      value={item.owner}
                      onChange={(e) => {
                        const updated = [...formData.actionItems];
                        updated[idx].owner = e.target.value;
                        setFormData({ ...formData, actionItems: updated });
                      }}
                      className="w-32 bg-black/10 border border-app-border rounded-lg px-2 py-1 text-xs text-app-text outline-none"
                    />
                    <button
                      onClick={() => handleRemoveActionItem(item.id)}
                      className="p-1 text-app-text-muted hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Runbook Steps Editor */}
              <div className="space-y-1 pt-2 border-t border-app-border">
                <label className="block text-[10px] uppercase font-bold text-app-text-muted">
                  Runbook & Rollback Procedure
                </label>
                <textarea
                  rows={4}
                  value={formData.runbookSteps}
                  onChange={(e) => setFormData({ ...formData, runbookSteps: e.target.value })}
                  className="w-full bg-black/10 border border-app-border rounded-lg p-3 text-xs font-mono text-emerald-300 outline-none focus:border-app-accent"
                />
              </div>
            </div>
          )}

          {viewMode === 'raw' && (
            <div className="relative">
              <pre className="p-4 bg-black/30 rounded-xl text-xs font-mono text-app-text border border-app-border overflow-x-auto whitespace-pre-wrap select-all">
                {generateMarkdown()}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-app-border bg-app-ui/40">
          <div className="text-xs text-app-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-app-accent-text" />
            <span>Ready to attach to Jira / GitHub Issue / Confluence</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border bg-app-ui text-xs font-bold text-app-text hover:bg-app-ui/80 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Markdown!' : 'Copy Markdown'}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-app-accent hover:bg-app-accent-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
