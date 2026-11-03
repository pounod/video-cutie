import React, { useState } from 'react';
import { GitBranch, Play, Check, Copy, Download, Tag, FileText, Sparkles, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

  const releaseReportText = `# 优化完成汇报（v1.1）

### 🏷️ 软件基本信息
- **中文名称**：视频剪辑姬
- **英文名称**：Video Cutie
- **当前版本**：v1.1
- **运行平台**：macOS 11.0 Big Sur 及以上（支持 macOS 15+ Sequoia）
- **芯片架构**：Universal 通用二进制架构（原生同时兼容 Apple Silicon M1~M4 与 Intel x86_64）
- **核心算法**：音视频流无损直接复制（-c:v copy -c:a copy）+ 毫秒级时间戳归零（-avoid_negative_ts make_zero）

---

### 🚀 v1.1 核心优化与更新内容

#### 1. 软件品牌与视觉升级
- **更名发布**：应用正式确立中文名「视频剪辑姬」、英文名「Video Cutie」，版本号同步升级为 1.1。
- **全新扁平化 macOS 图标**：重绘符合现代 Apple Design 规范的圆角 Squircle 图标，融入灵动胶片切片、微光星芒与极简剪刀元素。

#### 2. 建立完整的 GitHub Actions 自动化 CI/CD 构建体系
- **手动触发构建（workflow_dispatch）**：代码同步至 GitHub 仓库后，直接在 Actions 面板点击「Run workflow」即可一键触发 macOS 编译流。
- **自动发布至 GitHub Releases**：
  - 发布标题规范化设定为：视频剪辑姬（Video Cutie）v1.1
  - 自动提取本次「优化完成汇报」作为 Releases 正文。
  - 自动编译生成并上传 VideoCutie-1.1-Universal.dmg 与 .zip 免安装包。

#### 3. 时间智能自动补全深度增强（012536 → 01:25:36）
- **数字自动切分**：输入 012536 自动补全为 01:25:36，兼顾时分秒合法性与默认边界（省略开始默认为0，省略结束默认为总时长）。

#### 4. 原画级音视频流直接复制（-c copy）体验完善
- 绝对零画质损耗，保留母带级分辨率、码率、HDR 与原声音频。`;

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
                GitHub Actions 自动化 CI/CD 与 Releases 发布
              </h2>
              <span className="text-[11px] font-mono bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30 font-semibold">
                v{APP_INFO.version}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              代码推送到 GitHub 后可手动在 Actions 中一键打包 Universal DMG，并自动发布 Releases。
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
            <span>下载 .github/workflows/build-dmg.yml</span>
          </button>
        </div>
      </div>

      {/* Proactive Tip for Lockfile Resolution */}
      <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/80 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">已修复 setup-node 缺少 Lockfile 导致的 CI 中断</span>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
            GitHub Actions 提示 <code>Dependencies lock file is not found</code> 是因为 <code>actions/setup-node</code> 开启了强制缓存。现已在工作流中解绑该强制依赖，并生成提交了标准 <code>package-lock.json</code>，确保在任何代码分支或全新拉取中均能 100% 顺畅构建并发布 DMG。
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
            <span className="text-xs text-neutral-500 font-mono">Tag: v1.1</span>
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
                  VideoCutie-1.1-Universal.dmg
                </span>
                <span className="text-[11px] font-mono text-neutral-500 shrink-0">~85 MB</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80">
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  VideoCutie-1.1-macOS-Universal.zip
                </span>
                <span className="text-[11px] font-mono text-neutral-500 shrink-0">~78 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Manual Trigger Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs">1</span>
            <span>代码同步到 GitHub</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            将当前工作区代码推送至 GitHub 仓库（包含 <code className="bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded font-mono">.github/workflows/build-dmg.yml</code> 与打包脚本）。
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-semibold">
            <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-xs">2</span>
            <span>手动触发 Actions 构建</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            打开仓库中的 <strong>Actions</strong> 标签页，在左侧选择对应工作流，点击右侧 <strong>「Run workflow」</strong> 输入版本号即可触发。
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs">3</span>
            <span>自动在 Releases 发布</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            构建成功后，工作流自动创建以 <strong>视频剪辑姬（Video Cutie）v1.1</strong> 为标题的 Release，并附带优化汇报与 DMG 安装包。
          </p>
        </div>
      </div>

      {/* Full Workflow YAML Inspection View */}
      <div className="p-4 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-500" />
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              .github/workflows/build-dmg.yml 完整工作流配置
            </h4>
          </div>
          <button
            onClick={() => handleCopy(GITHUB_WORKFLOW_YAML, 'yaml')}
            className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
          >
            {copiedType === 'yaml' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'yaml' ? '已复制全部配置' : '一键复制代码'}</span>
          </button>
        </div>

        <div className="p-4 bg-neutral-950 text-neutral-200 rounded-lg font-mono text-xs overflow-x-auto border border-neutral-800 max-h-72 leading-relaxed">
          <pre>{GITHUB_WORKFLOW_YAML}</pre>
        </div>
      </div>
    </div>
  );
};
