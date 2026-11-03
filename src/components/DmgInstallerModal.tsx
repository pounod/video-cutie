import React, { useState } from 'react';
import { Download, Cpu, HardDrive, ArrowRight, ShieldCheck, Check, FolderDown, Terminal, GitBranch } from 'lucide-react';
import { APP_INFO, createSyntheticDmgBlob, generateDmgBuildScript, downloadFile } from '../utils/dmgGenerator';

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

  const handleDownloadBuildScript = () => {
    const script = generateDmgBuildScript();
    downloadFile('build-universal-dmg.sh', script, 'text/x-sh');
    setDownloadSuccess('script');
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
            通用二进制架构 (Universal Binary)，原生兼容全系列 Apple Silicon 芯片 (M1/M2/M3/M4) 与 Intel (x86_64) 芯片。
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
                  src="/src/assets/images/video_cutie_icon_1793694252197.jpg"
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
              已集成 Apple Silicon (arm64) 与 Intel (x86_64) 双原生执行切片
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
                <span>下载 Universal .dmg 安装包 (推荐)</span>
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

      {/* Dual Architecture Specs Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apple Silicon */}
        <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Apple Silicon 原生架构 (arm64)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-medium">
              M1 / M2 / M3 / M4
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            支持苹果自研 M 系列全线处理器。自动匹配 Homebrew 默认路径
            <code className="mx-1 px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono text-[11px]">
              /opt/homebrew/bin/ffmpeg
            </code>
            ，无损视频流复制无需经过 Rosetta 2 转译，发挥全速性能与极低能耗。
          </p>
        </div>

        {/* Intel x86_64 */}
        <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Intel x86_64 原生架构
              </h3>
            </div>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded font-medium">
              Core i5 / i7 / i9 / Xeon
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            完美兼容配备 Intel 芯片的 Mac 电脑。自动优先检测 Intel 路径
            <code className="mx-1 px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono text-[11px]">
              /usr/local/bin/ffmpeg
            </code>
            ，同样以原生 x86_64 指令执行无损音视频流复制作业。
          </p>
        </div>
      </div>

      {/* Local DMG Build Script section */}
      <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              macOS 本地一键构建 DMG 脚本 (开发者工具)
            </h3>
          </div>
          <button
            onClick={handleDownloadBuildScript}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-pink-500" />
            <span>下载 build-universal-dmg.sh</span>
          </button>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300">
          如果你希望在本地终端直接使用 macOS 原生
          <code className="mx-1 px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono text-[11px]">hdiutil</code>
          或
          <code className="mx-1 px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono text-[11px]">create-dmg</code>
          编译打包，可一键运行此脚本：
        </p>

        <div className="p-3 bg-neutral-950 text-neutral-200 rounded-lg font-mono text-xs overflow-x-auto border border-neutral-800">
          <div className="text-neutral-400"># 赋权并执行构建脚本</div>
          <div className="text-emerald-400 font-semibold">$ chmod +x ./scripts/build-dmg.sh && ./scripts/build-dmg.sh 1.1</div>
          <div className="text-neutral-400 mt-1"># 成功在 dist-dmg/ 目录生成: VideoCutie-1.1-Universal.dmg</div>
        </div>
      </div>
    </div>
  );
};
