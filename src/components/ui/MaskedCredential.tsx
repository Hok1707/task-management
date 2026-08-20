import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuditStore } from '../../stores/useAuditStore';

interface MaskedCredentialProps {
  value: string;
  envName?: string;
  maskLength?: number;
  maskChar?: string;
}

export function MaskedCredential({ value, envName, maskLength = 16, maskChar = '•' }: MaskedCredentialProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const toggleReveal = () => {
    const nextState = !isRevealed;
    setIsRevealed(nextState);
    if (nextState && envName) {
      useAuditStore.getState().addLog(
        'vault_revealed',
        envName,
        `Credential secret revealed for ${envName}`,
        'warning'
      );
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    if (envName) {
      useAuditStore.getState().addLog(
        'vault_revealed',
        envName,
        `Credential secret copied to clipboard for ${envName}`,
        'critical'
      );
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-center gap-2">
      <div className="flex-1 text-app-text-muted text-[10px] font-mono truncate bg-black/10 rounded p-1.5 border border-app-border select-none">
        {isRevealed ? value : maskChar.repeat(maskLength)}
      </div>
      <div className="flex items-center">
        <button
          onClick={toggleReveal}
          className="p-1.5 text-app-text-muted hover:text-app-text transition-colors bg-app-ui rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 mr-1 flex-shrink-0 cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
          title={isRevealed ? "Hide credential" : "Reveal credential"}
          aria-label={isRevealed ? "Hide credential" : "Reveal credential"}
        >
          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-app-accent-text" />}
        </button>
        <button
          onClick={copyToClipboard}
          className="p-1.5 text-app-text-muted hover:text-app-text transition-colors bg-app-ui rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
