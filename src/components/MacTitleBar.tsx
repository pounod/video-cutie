import React from 'react';
import appIcon from '../assets/app_icon.png';
import { APP_INFO } from '../utils/dmgGenerator';

export const MacTitleBar: React.FC = () => {
  return (
    <header 
      className="flex items-center justify-between pl-20 pr-4 py-2.5 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 select-none sticky top-0 z-40 transition-colors"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Native title bar spacing for macOS Traffic Lights + Clean App Branding */}
      <div className="flex items-center gap-2.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <img
          src={appIcon}
          alt="视频剪辑姬"
          className="w-6 h-6 rounded-md object-cover"
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
    </header>
  );
};
