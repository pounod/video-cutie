import React from 'react';
import { Scissors, Download, GitBranch, Moon, Sun, Info } from 'lucide-react';
import { APP_INFO } from '../utils/dmgGenerator';

interface MacTitleBarProps {
  activeTab: 'trimmer' | 'dmg' | 'actions';
  setActiveTab: (tab: 'trimmer' | 'dmg' | 'actions') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAbout: () => void;
}

export const MacTitleBar: React.FC<MacTitleBarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  onOpenAbout,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 select-none sticky top-0 z-40 transition-colors">
      {/* Zone 1: macOS Traffic Lights & Clean App Title */}
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

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/60 dark:bg-neutral-800/60 px-2 py-0.5 rounded-sm">
            内置 FFmpeg · 免终端
          </span>
        </div>
      </div>

      {/* Zone 2: macOS Clean Segmented Controls (No Terminal Tab) */}
      <nav className="flex items-center p-1 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-lg text-xs font-medium">
        <button
          onClick={() => setActiveTab('trimmer')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'trimmer'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-pink-500" />
          <span>视频剪辑</span>
        </button>

        <button
          onClick={() => setActiveTab('dmg')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'dmg'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-amber-500" />
          <span>下载 .DMG</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'actions'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-blue-500" />
          <span>GitHub Actions 构建</span>
        </button>
      </nav>

      {/* Zone 3: Quick Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={toggleDarkMode}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
          title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>

        <button
          onClick={onOpenAbout}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
          title="关于 视频剪辑姬"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
