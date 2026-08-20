import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickTemplate {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  quickTemplates?: QuickTemplate[];
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  badge,
  primaryAction,
  secondaryAction,
  quickTemplates,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border border-dashed border-app-border bg-black/5 text-center flex flex-col items-center justify-center"
      >
        <div className="w-8 h-8 rounded-lg bg-app-ui flex items-center justify-center text-app-text-muted mb-2.5 border border-app-border">
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-app-text mb-1">{title}</h4>
        <p className="text-[11px] text-app-text-muted max-w-[200px] leading-relaxed mb-3">
          {description}
        </p>

        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-app-accent hover:bg-app-accent-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5" />}
            <span>{primaryAction.label}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="mt-2 text-[10px] text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 sm:p-12 rounded-2xl border border-app-border bg-app-panel/60 backdrop-blur-sm text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8 shadow-xs"
    >
      {badge && (
        <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-app-accent/10 text-app-accent-text border border-app-accent/20 mb-3 tracking-wider">
          {badge}
        </span>
      )}

      <div className="w-14 h-14 rounded-2xl bg-app-ui border border-app-border flex items-center justify-center text-app-accent-text mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-app-text mb-2 tracking-tight">{title}</h3>
      <p className="text-xs text-app-text-muted max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
            <span>{primaryAction.label}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-border bg-app-ui text-app-text hover:bg-app-ui/80 text-xs font-semibold transition-all cursor-pointer"
          >
            {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
            <span>{secondaryAction.label}</span>
          </button>
        )}
      </div>

      {/* Quick Templates / Presets */}
      {quickTemplates && quickTemplates.length > 0 && (
        <div className="w-full pt-6 border-t border-app-border/70">
          <div className="text-[10px] uppercase font-bold text-app-text-muted tracking-wider mb-2.5">
            Or get started with a template
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={template.onClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border bg-black/5 hover:border-app-border-hover hover:bg-black/10 text-app-text text-[11px] font-medium transition-all cursor-pointer"
              >
                {template.icon && <template.icon className="w-3 h-3 text-app-accent-text" />}
                <span>{template.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
