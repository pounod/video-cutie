import React from 'react';
import { Moon, Sun, Info } from 'lucide-react';
import { APP_INFO } from '../utils/dmgGenerator';

interface MacTitleBarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAbout: () => void;
}

export const MacTitleBar: React.FC<MacTitleBarProps> = ({
  isDarkMode,
  toggleDarkMode,
  onOpenAbout,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 select-none sticky top-0 z-40 transition-colors">
      {/* Zone 1: macOS Traffic Lights & Clean App Branding */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="flex items-center gap-2 pr-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-xs" title="关闭" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-xs" title="最小化" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-xs" title="最大化" />
        </div>

        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/app_icon.png"
            alt="视频剪辑姬 (Video Cutie)"
            className="w-5 h-5 rounded-md object-cover shadow-xs"
            referrerPolicy="no-referrer"
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
      </div>

      {/* Zone 2: Quick Controls (Theme Toggle & About) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleDarkMode}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors"
          title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>

        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/60 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          title="关于 视频剪辑姬"
        >
          <Info className="w-3.5 h-3.5" />
          <span>关于</span>
        </button>
      </div>
    </header>
  );
};
