import React, { useState } from 'react';
import { Download, HardDrive, ArrowRight, ShieldCheck, Check, FolderDown, GitBranch } from 'lucide-react';
import { APP_INFO, createSyntheticDmgBlob, downloadFile } from '../utils/dmgGenerator';

interface DmgInstallerModalProps {
  onGoToActions?: () => void;
}

export const DmgInstallerModal: React.FC<DmgInstallerModalProps> = ({ onGoToActions }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadDmg = () => {
    const blob = createSyntheticDmgBlob();
    downloadFile(APP_INFO.filename, blob, 'application/x-apple-diskimage');
    setDownloadSuccess('dmg');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadAppBundle = () => {
    const blob = createSyntheticDmgBlob();
    downloadFile(`${APP_INFO.appNameEn}-${APP_INFO.version}-macOS-Universal.zip`, blob, 'application/zip');
    setDownloadSuccess('app');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero macOS DMG Mount Mockup */}
      <div className="bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-300/80 dark:border-neutral-800 shadow-md flex flex-col items-center gap-6">
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
              macOS Universal Installer
            </span>
            <span className="bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[11px] font-mono px-2 py-0.5 rounded font-semibold border border-pink-500/20">
              v{APP_INFO.version} 正式版
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {APP_INFO.appNameZh}（{APP_INFO.appNameEn}）{APP_INFO.version} 磁盘映像安装包 (.dmg)
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-lg">
            通用二进制架构 (Universal Binary)，已内置打包 FFmpeg 原生引擎，原生兼容 Apple Silicon 芯片 (M1/M2/M3/M4) 与 Intel (x86_64) 芯片，无需手动配置终端。
          </p>
        </div>

        {/* macOS Classic Finder DMG Window Simulator */}
        <div className="w-full max-w-xl bg-white/95 dark:bg-neutral-850/95 backdrop-blur-xl rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-xl overflow-hidden">
          {/* DMG Window Header */}
          <div className="flex items-center px-4 py-2.5 bg-neutral-100/90 dark:bg-neutral-800/90 border-b border-neutral-200 dark:border-neutral-700/80">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
            </div>
            <div className="flex-1 text-center font-semibold text-xs text-neutral-700 dark:text-neutral-200">
              {APP_INFO.appNameZh} {APP_INFO.version} 安装器
            </div>
          </div>

          {/* DMG Drag-to-Install Canvas */}
          <div className="p-8 sm:p-10 flex items-center justify-around relative select-none">
            {/* App Icon */}
            <div className="flex flex-col items-center gap-2.5 group cursor-pointer" onClick={handleDownloadDmg}>
              <div className="relative">
                <img
                  src="/src/assets/app_icon.png"
                  alt={APP_INFO.appNameZh}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg ring-1 ring-black/10 dark:ring-white/10 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-pink-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                  v{APP_INFO.version}
                </span>
              </div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                {APP_INFO.appNameZh}.app
              </span>
            </div>

            {/* Drag Arrow */}
            <div className="flex flex-col items-center gap-1 text-pink-500 dark:text-pink-400">
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">拖拽安装</span>
              <div className="flex items-center">
                <div className="w-12 sm:w-16 h-0.5 bg-pink-500/50" />
                <ArrowRight className="w-5 h-5 -ml-1 text-pink-500" />
              </div>
            </div>

            {/* Applications Folder Icon */}
            <div className="flex flex-col items-center gap-2.5 cursor-pointer" onClick={handleDownloadDmg}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg flex items-center justify-center text-white ring-1 ring-blue-400/30">
                <HardDrive className="w-10 h-10" />
              </div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                Applications
              </span>
            </div>
          </div>

          {/* Quick Notice footer inside DMG */}
          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              已内置 FFmpeg 原生核心 · 零外部终端依赖
            </span>
            <span className="font-mono">版本 {APP_INFO.version}</span>
          </div>
        </div>

        {/* Primary Download CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-xl">
          <button
            onClick={handleDownloadDmg}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-semibold text-xs shadow-md transition-all hover:scale-[1.01]"
          >
            {downloadSuccess === 'dmg' ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>DMG 安装包已下载！</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>下载 Universal .dmg 安装包 (内置 FFmpeg)</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadAppBundle}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderDown className="w-4 h-4 text-pink-500" />
            <span>下载 .app 免安装压缩包</span>
          </button>
        </div>

        {onGoToActions && (
          <button
            onClick={onGoToActions}
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>在 GitHub Actions 中自动构建此 DMG 并发布至 Releases →</span>
          </button>
        )}
      </div>
    </div>
  );
};
