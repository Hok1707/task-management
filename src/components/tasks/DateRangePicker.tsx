import React from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { Calendar as CalendarIcon, X, Clock, CalendarDays, Check } from 'lucide-react';
import { format, startOfDay, endOfDay, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

export function DateRangePicker({ compact = false }: { compact?: boolean }) {
  const { dateFilter, setDateFilter, clearDateFilter } = useTaskStore();
  const { startDate, endDate, field } = dateFilter;
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const hasActiveFilter = Boolean(startDate || endDate);

  const setPreset = (preset: 'today' | 'next7' | 'next30' | 'past7' | 'thisMonth') => {
    const today = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'today':
        start = format(startOfDay(today), 'yyyy-MM-dd');
        end = format(endOfDay(today), 'yyyy-MM-dd');
        break;
      case 'next7':
        start = format(startOfDay(today), 'yyyy-MM-dd');
        end = format(endOfDay(addDays(today, 7)), 'yyyy-MM-dd');
        break;
      case 'next30':
        start = format(startOfDay(today), 'yyyy-MM-dd');
        end = format(endOfDay(addDays(today, 30)), 'yyyy-MM-dd');
        break;
      case 'past7':
        start = format(startOfDay(subDays(today, 7)), 'yyyy-MM-dd');
        end = format(endOfDay(today), 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        start = format(startOfMonth(today), 'yyyy-MM-dd');
        end = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
    }

    setDateFilter({ startDate: start, endDate: end });
  };

  const getFieldLabel = () => {
    switch (field) {
      case 'dueDate':
        return 'Due Date';
      case 'startDate':
        return 'Start Date';
      case 'createdAt':
        return 'Created Date';
    }
  };

  if (compact) {
    return (
      <div className="relative">
        {/* Desktop inline compact filter */}
        <div className="hidden lg:flex items-center gap-1.5 bg-black/5 border border-app-border rounded-lg px-2.5 py-1 text-xs">
          <CalendarIcon className="w-3.5 h-3.5 text-app-accent-text shrink-0" />
          <select
            value={field}
            onChange={(e) => setDateFilter({ field: e.target.value as any })}
            className="bg-transparent text-app-text text-xs outline-none cursor-pointer font-medium"
          >
            <option value="dueDate" className="bg-app-panel text-app-text">Due Date</option>
            <option value="startDate" className="bg-app-panel text-app-text">Start Date</option>
            <option value="createdAt" className="bg-app-panel text-app-text">Created</option>
          </select>
          <span className="text-app-border">|</span>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => setDateFilter({ startDate: e.target.value || undefined })}
            className="bg-transparent text-xs text-app-text outline-none cursor-pointer [color-scheme:dark] max-w-[110px]"
            title="Start interval"
          />
          <span className="text-app-text-muted text-[10px]">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => setDateFilter({ endDate: e.target.value || undefined })}
            className="bg-transparent text-xs text-app-text outline-none cursor-pointer [color-scheme:dark] max-w-[110px]"
            title="End interval"
          />
          {hasActiveFilter && (
            <button
              onClick={clearDateFilter}
              className="p-1 hover:text-red-400 text-app-text-muted transition-colors cursor-pointer"
              title="Clear date filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Mobile & Tablet Compact Trigger Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer min-h-[32px] ${
              hasActiveFilter
                ? 'bg-app-accent/15 text-app-accent-text border-app-accent/30 font-bold'
                : 'bg-black/5 border-app-border text-app-text-muted hover:text-app-text hover:bg-app-ui'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>
              {hasActiveFilter
                ? `${getFieldLabel()}: ${startDate || '…'} → ${endDate || '…'}`
                : 'Dates'}
            </span>
            {hasActiveFilter && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateFilter();
                }}
                className="hover:text-red-400 p-0.5"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>

          {isMobileOpen && (
            <div className="absolute left-0 top-full mt-2 z-40 w-72 bg-app-panel border border-app-border rounded-xl shadow-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-app-border pb-2">
                <span className="font-bold text-app-text">Filter by Date</span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-app-text-muted hover:text-app-text rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1 font-bold">Field</label>
                <select
                  value={field}
                  onChange={(e) => setDateFilter({ field: e.target.value as any })}
                  className="w-full bg-black/10 border border-app-border rounded-lg p-1.5 text-xs text-app-text outline-none"
                >
                  <option value="dueDate" className="bg-app-panel text-app-text">Due Date</option>
                  <option value="startDate" className="bg-app-panel text-app-text">Start Date</option>
                  <option value="createdAt" className="bg-app-panel text-app-text">Created</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">From</label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setDateFilter({ startDate: e.target.value || undefined })}
                    className="w-full bg-black/10 border border-app-border rounded-lg p-1.5 text-xs text-app-text outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">To</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setDateFilter({ endDate: e.target.value || undefined })}
                    className="w-full bg-black/10 border border-app-border rounded-lg p-1.5 text-xs text-app-text outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {hasActiveFilter && (
                  <button
                    onClick={() => {
                      clearDateFilter();
                      setIsMobileOpen(false);
                    }}
                    className="text-red-400 text-xs hover:underline cursor-pointer"
                  >
                    Reset Date
                  </button>
                )}
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="ml-auto px-3 py-1 bg-app-accent text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-app-accent-text" />
          Date Range Filter
        </h3>
        {hasActiveFilter && (
          <button
            onClick={clearDateFilter}
            className="text-[10px] text-red-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">Target Field</label>
          <div className="grid grid-cols-3 gap-1 bg-black/10 p-0.5 rounded-lg border border-app-border">
            <button
              type="button"
              onClick={() => setDateFilter({ field: 'dueDate' })}
              className={`py-1 text-[10px] font-medium rounded transition-all cursor-pointer ${
                field === 'dueDate' ? 'bg-app-accent text-white shadow-xs font-bold' : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              Due Date
            </button>
            <button
              type="button"
              onClick={() => setDateFilter({ field: 'startDate' })}
              className={`py-1 text-[10px] font-medium rounded transition-all cursor-pointer ${
                field === 'startDate' ? 'bg-app-accent text-white shadow-xs font-bold' : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              Start Date
            </button>
            <button
              type="button"
              onClick={() => setDateFilter({ field: 'createdAt' })}
              className={`py-1 text-[10px] font-medium rounded transition-all cursor-pointer ${
                field === 'createdAt' ? 'bg-app-accent text-white shadow-xs font-bold' : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              Created
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">Quick Presets</label>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setPreset('today')}
              className="px-2 py-0.5 text-[10px] bg-black/10 hover:bg-app-ui border border-app-border rounded text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset('next7')}
              className="px-2 py-0.5 text-[10px] bg-black/10 hover:bg-app-ui border border-app-border rounded text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              Next 7 Days
            </button>
            <button
              type="button"
              onClick={() => setPreset('next30')}
              className="px-2 py-0.5 text-[10px] bg-black/10 hover:bg-app-ui border border-app-border rounded text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              Next 30 Days
            </button>
            <button
              type="button"
              onClick={() => setPreset('thisMonth')}
              className="px-2 py-0.5 text-[10px] bg-black/10 hover:bg-app-ui border border-app-border rounded text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              This Month
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">From</label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setDateFilter({ startDate: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 bg-black/10 border border-app-border rounded-lg text-xs text-app-text outline-none focus:border-app-accent [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-app-text-muted mb-1">To</label>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setDateFilter({ endDate: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 bg-black/10 border border-app-border rounded-lg text-xs text-app-text outline-none focus:border-app-accent [color-scheme:dark]"
            />
          </div>
        </div>

        {hasActiveFilter && (
          <div className="bg-app-accent/10 border border-app-accent/20 rounded-lg p-2 text-[10px] text-app-accent-text flex items-center justify-between mt-2">
            <span>
              Filtering by {getFieldLabel()}: <strong className="font-semibold">{startDate || 'Any'}</strong> → <strong className="font-semibold">{endDate || 'Any'}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
