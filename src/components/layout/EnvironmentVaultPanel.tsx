import { useVaultStore } from '../../stores/useVaultStore';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaskedCredential } from '../ui/MaskedCredential';

export function EnvironmentVaultPanel() {
  const { environments, addEnvironment, deleteEnvironment } = useVaultStore();

  const handleAddEnv = () => {
    addEnvironment({
      envName: 'New Environment',
      baseUrl: 'https://',
      username: '',
      secretKey: '',
    });
  };

  return (
    <div className="w-64 h-full border-r border-app-border bg-app-panel flex flex-col p-5 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-app-accent rounded-lg flex items-center justify-center text-white font-bold">D</div>
        <span className="text-app-text font-semibold tracking-tight">DevVault.io</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="flex justify-between items-center px-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold">Environments</h3>
          <button
            onClick={handleAddEnv}
            className="text-app-text-muted hover:text-app-accent-text transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <AnimatePresence>
          {environments.map((env) => (
            <motion.div
              key={env.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black/5 border border-app-border rounded-xl p-4 hover:border-app-border-hover transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs text-app-text">{env.envName}</h3>
                <button
                  onClick={() => deleteEnvironment(env.id)}
                  className="text-app-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete Environment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-app-text-muted font-mono truncate bg-black/10 rounded p-1.5 border border-app-border select-none">
                    {env.baseUrl}
                  </div>
                </div>

                <MaskedCredential value={env.secretKey} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-auto p-4 bg-black/5 rounded-xl border border-app-border">
        <div className="text-[11px] text-app-text-muted mb-2 font-bold uppercase">Current Context</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-app-text font-mono">STAGING-US-01</span>
        </div>
      </div>
    </div>
  );
}
