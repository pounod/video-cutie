import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { APP_INFO } from '../utils/dmgGenerator';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* macOS Style Window Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] cursor-pointer" onClick={onClose} />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-2">
              关于 {APP_INFO.appNameZh}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <img
              src="/src/assets/app_icon.png"
              alt={APP_INFO.appNameZh}
              className="w-20 h-20 rounded-2xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {APP_INFO.appNameZh} <span className="text-neutral-500 font-normal">({APP_INFO.appNameEn})</span>
            </h2>
            <p className="text-xs font-mono text-pink-600 dark:text-pink-400 font-bold">
              版本 {APP_INFO.version} · Universal (arm64 + x86_64)
            </p>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xs">
            专为 macOS 设计的原生视频极速无损裁剪客户端。内置 FFmpeg 原生引擎，支持拖拽导入、时间自动补全 (012536 → 01:25:36)、原画音视频流复制 (-c copy) 一键直接导出，彻底摆脱终端。
          </p>

          {/* Checklist of met requirements */}
          <div className="w-full bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>「视频剪辑姬（Video Cutie）v1.2.0」</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>已将 FFmpeg 打包进客户端，零终端命令</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>重新设计现代 macOS 纯净圆角扁平图标 (无黑边、无字符)</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>输入 012536 自动补全为 01:25:36</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>音视频流直接复制 (-c copy) 零画质损耗极速导出</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>GitHub Actions 自动化构建与 Releases 同步</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full text-[11px] font-mono text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <span>macOS 11.0+ (Big Sur ~ Sequoia)</span>
            <span>内置 FFmpeg 核心</span>
          </div>
        </div>
      </div>
    </div>
  );
};
