import React, { useState } from 'react';
import { GitBranch, Check, Copy, Download, Tag, FileText, ShieldCheck } from 'lucide-react';
import { GITHUB_WORKFLOW_YAML, downloadFile, APP_INFO } from '../utils/dmgGenerator';

export const GitHubActionsModal: React.FC = () => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadWorkflow = () => {
    downloadFile('build-dmg.yml', GITHUB_WORKFLOW_YAML, 'text/yaml');
  };

  const releaseReportText = `# 优化完成汇报（v1.2.0）

### 🏷️ 软件基本信息
- **中文名称**：视频剪辑姬
- **英文名称**：Video Cutie
- **当前版本**：v1.2.0
- **运行平台**：macOS 11.0 Big Sur 及以上（支持 macOS 15+ Sequoia）
- **芯片架构**：Universal 通用二进制架构（原生同时兼容 Apple Silicon M1~M4 与 Intel x86_64）
- **客户端架构**：原生 macOS Cocoa + WebKit 独立桌面窗口程序（离线独立运行）
- **内置引擎**：FFmpeg 原生二进制预打包至 \`Contents/MacOS/ffmpeg\`（零终端命令，免手动安装）
- **裁剪模式**：音视频流无损直接拷贝（-c:v copy -c:a copy）+ 时间戳精准对齐

---

### 🚀 v1.2.0 核心优化内容

#### 1. 彻底去除终端指令，改为客户端纯图形化一键极速剪辑
- 移除所有复制终端命令、下载 shell 脚本及终端日志的冗余交互。
- 视频裁剪改为客户端原生一键导出：点击「一键无损剪辑导出」即可直接生成目标视频。

#### 2. 将 FFmpeg 打包进客户端，并由 GitHub Actions 自动化构建
- 在 GitHub Actions 打包流中集成 \`brew install ffmpeg\`，并将编译好的 Universal 原生二进制写入应用包内（\`Contents/MacOS/ffmpeg\`）。
- macOS 客户端（main.swift）通过原生进程接口直接调用内置的 FFmpeg 引擎，用户无需打开终端，无需安装 Homebrew。

#### 3. 重新设计应用图标（符合现代 macOS HIG 设计规范）
- 消除四周黑边，采用完整精致的圆角矩形（macOS Squircle）。
- 画面简洁细腻无文字字符，去除高光玻璃拟物杂质，纯净现代扁平风格。
- 已同步生成 Retina 多分辨率 AppIcon.icns 与 Dock 高清图标。

#### 4. 客户端界面全面极简精致化
- 精简操作区，聚焦“拖入视频 → 设定时间（智能补全）→ 一键导出”，杜绝无关信息干扰。`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl border border-neutral-700/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <GitBranch className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                GitHub Actions 自动化打包与 Releases 发布
              </h2>
              <span className="text-[11px] font-mono bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30 font-semibold">
                v{APP_INFO.version}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              内置 FFmpeg 打包，代码推送到 GitHub 后可手动在 Actions 中一键打包 Universal DMG 并自动发布 Releases。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleCopy(GITHUB_WORKFLOW_YAML, 'workflow')}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {copiedType === 'workflow' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'workflow' ? '已复制 YAML' : '复制 Workflows 配置'}</span>
          </button>
          <button
            onClick={handleDownloadWorkflow}
            className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 build-dmg.yml</span>
          </button>
        </div>
      </div>

      {/* Proactive Tip for FFmpeg Bundling */}
      <div className="p-3.5 bg-pink-50 dark:bg-pink-950/40 rounded-xl border border-pink-200/80 dark:border-pink-800/80 flex items-start gap-2.5 text-xs text-pink-900 dark:text-pink-200">
        <ShieldCheck className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">已集成 FFmpeg 自动化打包机制</span>
          <span className="text-[11px] text-pink-700 dark:text-pink-300 leading-relaxed">
            GitHub Actions 运行器会在 macOS 构建环境中预先拉取 FFmpeg 并注入到 <code>Contents/MacOS/ffmpeg</code>，使用户安装生成的 DMG 后立即可用，完全无需安装终端或第三方命令。
          </span>
        </div>
      </div>

      {/* GitHub Releases Preview Card */}
      <div className="p-5 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-pink-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              GitHub Releases 发布预览效果
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2.5 py-0.5 rounded-md">
            触发源: workflow_dispatch (手动触发)
          </span>
        </div>

        {/* GitHub Release Box Mockup */}
        <div className="p-4 sm:p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3 font-sans">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {APP_INFO.releaseTitle}
              </h4>
              <span className="text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Latest Release
              </span>
            </div>
            <span className="text-xs text-neutral-500 font-mono">Tag: v1.2.0</span>
          </div>

          <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-200 dark:border-neutral-800 pt-3 flex flex-col gap-2">
            <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>更新内容（发布正文由本次“优化完成汇报”自动注入）：</span>
            </div>
            <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto">
              {releaseReportText}
            </div>
          </div>

          {/* Release Assets List */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Release 自动上传的资产列表 (Assets):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80">
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  VideoCutie-1.2.0-Universal.dmg
                </span>
                <span className="text-[11px] font-mono text-neutral-500 shrink-0">内置 FFmpeg (~95 MB)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80">
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  VideoCutie-1.2.0-macOS-Universal.zip
                </span>
                <span className="text-[11px] font-mono text-neutral-500 shrink-0">便携 Zip (~88 MB)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
