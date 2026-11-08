import React from 'react';
import { Moon, Sun } from 'lucide-react';
import appIcon from '../assets/app_icon.png';
import { APP_INFO } from '../utils/dmgGenerator';

interface MacTitleBarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const MacTitleBar: React.FC<MacTitleBarProps> = ({
  isDarkMode,
  toggleDarkMode,
}) => {
  return (
    <header 
      className="flex items-center justify-between pl-20 pr-4 py-2.5 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 select-none sticky top-0 z-40 transition-colors"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Zone 1: Native title bar spacing for macOS Traffic Lights + Clean App Branding */}
      <div className="flex items-center gap-2.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <img
          src={appIcon}
          alt="视频剪辑姬"
          className="w-5 h-5 rounded-md object-cover shadow-xs"
        />
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
            {APP_INFO.appNameZh}
          </span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            ({APP_INFO.appNameEn})
          </span>
          <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400 ml-0.5">
            v{APP_INFO.version}
          </span>
        </div>
      </div>

      {/* Zone 2: Titlebar Quick Controls (Theme Toggle) */}
      <div className="flex items-center gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>
      </div>
    </header>
  );
};
