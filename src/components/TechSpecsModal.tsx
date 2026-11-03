import React from 'react';
import { BookOpen, Zap, Layers, Clock, Cpu, CheckCircle } from 'lucide-react';

export const TechSpecsModal: React.FC = () => {
  return (
    <div className="flex flex-col gap-5">
      {/* Overview Banner */}
      <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            TrimCraft 1.0 技术实现规范与原理解析
          </h3>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          深入了解无损视频流复制技术（Stream Copy）、时间自动补全算法以及 macOS 双芯片架构兼容原理。
        </p>
      </div>

      {/* Grid of 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Pillar 1: Stream Copy */}
        <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <Zap className="w-4 h-4" />
            <span>1. 音视频流复制技术 (-c copy)</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            传统视频剪辑软件（如 Premiere、剪映）导出时会进行全量二次编解码，不仅消耗极高 CPU/GPU 算力，还会导致画质模糊和色彩偏色。
            TrimCraft 采用 FFmpeg 原生流复制方案：
          </p>
          <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-300 list-disc pl-4">
            <li>
              <strong>零画质损耗：</strong>原封不动拷贝 H.264 / HEVC / ProRes 的原始压缩数据包（Packet）。
            </li>
            <li>
              <strong>毫秒级输出：</strong>10GB 的 4K 视频仅需不到 1 秒即可完成裁剪，速度受限于磁盘读写而非算力。
            </li>
            <li>
              <strong>完整保留参数：</strong>视频分辨率、帧率、HDR10 / Dolby Vision 元数据、BT.2020 色彩矩阵全部保留。
            </li>
          </ul>
        </div>

        {/* Pillar 2: 012536 Auto-formatting */}
        <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Clock className="w-4 h-4" />
            <span>2. 智能时间补全算法 (012536 → 01:25:36)</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            专为高频操作设计的输入解析引擎：
          </p>
          <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-300 list-disc pl-4">
            <li>
              <strong>数字自动切分：</strong>输入 6 位纯数字（如 <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded">012536</code>），自动按两位一切分注入冒号补全为 <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-bold">01:25:36</code>。
            </li>
            <li>
              <strong>边界默认值：</strong>若用户省略开始时间，自动默认为 <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded">00:00:00</code>；若省略结束时间，自动默认为视频播放总时长。
            </li>
            <li>
              <strong>合法性校验：</strong>自动校验秒数与分钟在 0~59 范围，超限自动进位或平滑修约。
            </li>
          </ul>
        </div>

        {/* Pillar 3: Dual Architecture */}
        <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
            <Cpu className="w-4 h-4" />
            <span>3. Universal 双架构支持 (Apple Silicon + Intel)</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            macOS 系统跨越两种截然不同的 CPU 指令集体系：
          </p>
          <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-300 list-disc pl-4">
            <li>
              <strong>Apple Silicon (ARM64)：</strong>M1, M2, M3, M4 原生调度，Homebrew 安装在 <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded">/opt/homebrew/bin</code>。
            </li>
            <li>
              <strong>Intel (x86_64)：</strong>Intel 芯片 Mac 原生调度，Homebrew 安装在 <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded">/usr/local/bin</code>。
            </li>
            <li>
              <strong>Universal 启动器：</strong>自动探查当前宿主机架构并挂载对应二进制与环境变量，免去用户手动配置的繁琐。
            </li>
          </ul>
        </div>

        {/* Pillar 4: Timestamp Synchronization */}
        <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
            <Layers className="w-4 h-4" />
            <span>4. 时间戳归零与音画同步 (-avoid_negative_ts)</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            在无损裁剪过程中，若直接切片，输出文件的首个关键帧时间戳可能为负数或带有原片偏移量（导致部分播放器前几秒黑屏或卡顿）。
          </p>
          <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-300 list-disc pl-4">
            <li>
              <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">-avoid_negative_ts make_zero</code>：强制重置输出时间戳基线，使切片从 00:00:00.000 完美起始。
            </li>
            <li>
              自动对齐音视频 DTS/PTS（解码与显示时间戳），彻底消除音画不同步。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
