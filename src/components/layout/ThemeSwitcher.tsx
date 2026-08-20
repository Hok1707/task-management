import { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore, Theme } from '../../stores/useThemeStore';

const themes: { id: Theme; name: string; color: string }[] = [
  { id: 'theme-bento-dark', name: 'Bento Dark', color: 'bg-slate-900' },
  { id: 'theme-bento-light', name: 'Bento Light', color: 'bg-slate-100' },
  { id: 'theme-midnight', name: 'Midnight', color: 'bg-purple-900' },
  { id: 'theme-forest', name: 'Forest', color: 'bg-emerald-900' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={themeMenuRef}>
      <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="w-8 h-8 rounded-full border border-app-border flex items-center justify-center hover:bg-app-ui transition-colors cursor-pointer">
        <Palette className="w-4 h-4 text-app-text-muted" />
      </button>
      {showThemeMenu && (
        <div className="absolute right-0 top-10 mt-2 w-48 bg-app-panel border border-app-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-app-text-muted border-b border-app-border">Theme</div>
          {themes.map((t) => (
            <button 
              key={t.id} 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                setTheme(t.id); 
                setShowThemeMenu(false); 
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-app-ui transition-colors cursor-pointer ${theme === t.id ? 'text-app-accent-text font-bold' : 'text-app-text'}`}
            >
              <div className={`w-3 h-3 rounded-full ${t.color} border border-app-border`} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
