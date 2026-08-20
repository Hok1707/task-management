import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck } from 'lucide-react';
import { useAuditStore } from '../../stores/useAuditStore';

interface MaskedCredentialProps {
  value: string;
  envName?: string;
  maskLength?: number;
  maskChar?: string;
  autoHideSeconds?: number;
}

export function MaskedCredential({
  value,
  envName,
  maskLength = 16,
  maskChar = '•',
  autoHideSeconds = 15,
}: MaskedCredentialProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Clean up auto-hide timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const toggleReveal = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const nextState = !isRevealed;
    setIsRevealed(nextState);

    if (nextState) {
      if (envName) {
        useAuditStore.getState().addLog(
          'vault_revealed',
          envName,
          `Credential secret revealed for ${envName}`,
          'warning'
        );
      }
      // Auto-hide after specified seconds for security
      if (autoHideSeconds > 0) {
        timerRef.current = window.setTimeout(() => {
          setIsRevealed(false);
        }, autoHideSeconds * 1000);
      }
    }
  };

  const copyToClipboard = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    if (envName) {
      useAuditStore.getState().addLog(
        'vault_revealed',
        envName,
        `Credential secret copied to clipboard for ${envName} (kept masked)`,
        'info'
      );
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <div className="flex justify-between items-center gap-2">
      <div
        className={`flex-1 text-[10px] font-mono truncate bg-black/10 rounded p-1.5 border border-app-border select-none ${
          !hasValue ? 'text-app-text-muted/60 italic' : isRevealed ? 'text-amber-400 font-semibold' : 'text-app-text-muted'
        }`}
        title={!hasValue ? 'No secret configured in .env' : isRevealed ? 'Visible' : 'Masked (Click copy to copy safely)'}
      >
        {!hasValue
          ? '(No secret set in .env)'
          : isRevealed
          ? value
          : maskChar.repeat(maskLength)}
      </div>
      <div className="flex items-center">
        {hasValue && (
          <button
            type="button"
            onClick={toggleReveal}
            className="p-1.5 text-app-text-muted hover:text-app-text transition-colors bg-app-ui rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 mr-1 flex-shrink-0 cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
            title={isRevealed ? "Hide credential" : `Reveal credential (auto-masks in ${autoHideSeconds}s)`}
            aria-label={isRevealed ? "Hide credential" : "Reveal credential"}
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-app-accent-text" />}
          </button>
        )}
        <button
          type="button"
          onClick={copyToClipboard}
          disabled={!hasValue}
          className={`p-1.5 transition-colors bg-app-ui rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 min-h-[30px] min-w-[30px] flex items-center justify-center ${
            !hasValue
              ? 'text-app-text-muted/40 cursor-not-allowed'
              : 'text-app-text-muted hover:text-app-text cursor-pointer'
          }`}
          title={isCopied ? "Copied securely to clipboard!" : "Copy secret key (stays masked)"}
          aria-label="Copy credential"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
