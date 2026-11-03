import React from 'react';
import { Scissors, Terminal, Download, Cpu, Moon, Sun, Info } from 'lucide-react';

interface MacTitleBarProps {
  activeTab: 'trimmer' | 'terminal' | 'dmg' | 'specs';
  setActiveTab: (tab: 'trimmer' | 'terminal' | 'dmg' | 'specs') => void;
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
      {/* Zone 1: macOS Traffic Lights & Wordmark */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="flex items-center gap-2 pr-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-xs" title="关闭" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-xs" title="最小化" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-xs" title="最大化" />
        </div>

        <div className="flex items-center gap-2">
          <img
            src="/src/assets/images/macos_trimmer_icon_1793693181920.jpg"
            alt="TrimCraft 1.0 Icon"
            className="w-5 h-5 rounded-md object-cover shadow-xs ring-1 ring-black/10 dark:ring-white/10"
            referrerPolicy="no-referrer"
          />
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
            TrimCraft <span className="text-xs font-mono font-normal text-neutral-500 dark:text-neutral-400">1.0</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/60 dark:bg-neutral-800/60 px-2 py-0.5 rounded-sm">
            <Cpu className="w-3 h-3 text-cyan-500" />
            Universal (arm64 + x86_64)
          </span>
        </div>
      </div>

      {/* Zone 2: macOS Segmented Controls */}
      <nav className="flex items-center p-1 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-lg text-xs font-medium">
        <button
          onClick={() => setActiveTab('trimmer')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'trimmer'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-blue-500" />
          <span>视频裁剪</span>
        </button>

        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'terminal'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span>FFmpeg 终端</span>
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
          <span>.DMG 安装包</span>
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
          title="关于 TrimCraft 1.0"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
