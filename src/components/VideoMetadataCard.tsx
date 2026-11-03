import React from 'react';
import { Film, Volume2, Sparkles, Zap, HardDrive, Check } from 'lucide-react';
import { formatSecondsToHHMMSS } from '../utils/timeFormat';

export interface VideoMetadata {
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  format: string;
  videoCodec: string;
  audioCodec: string;
  fps: number;
}

interface VideoMetadataCardProps {
  metadata: VideoMetadata | null;
  clipDuration: number;
}

export const VideoMetadataCard: React.FC<VideoMetadataCardProps> = ({ metadata, clipDuration }) => {
  if (!metadata) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Estimate output size based on stream copy ratio
  const estimatedOutputSize = metadata.duration > 0
    ? (metadata.size * (clipDuration / metadata.duration))
    : 0;

  return (
    <div className="bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 p-4 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            视频参数与元信息检测
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <Zap className="w-3.5 h-3.5" />
          <span>无损流复制准备就绪 (-c copy)</span>
        </div>
      </div>

      {/* Grid of metadata items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">分辨率 / 画面比</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {metadata.width} × {metadata.height}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {metadata.aspectRatio} ({metadata.height >= 2160 ? '4K UHD' : metadata.height >= 1080 ? '1080p FHD' : '720p HD'})
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">完整时长 / 帧率</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {formatSecondsToHHMMSS(metadata.duration)}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            ~{metadata.fps} fps ({metadata.duration.toFixed(2)}s)
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">原文件 / 格式容器</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={metadata.name}>
            {formatFileSize(metadata.size)}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono uppercase">
            {metadata.format || 'MP4 / QuickTime'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
          <span className="text-blue-700 dark:text-blue-400 text-[11px]">裁剪预计大小</span>
          <span className="font-mono font-bold text-blue-900 dark:text-blue-200">
            ~{formatFileSize(estimatedOutputSize)}
          </span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400/80 font-mono">
            保留 100% 原始画质
          </span>
        </div>
      </div>

      {/* Stream Copy Specifications Banner */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium">
            <Film className="w-3.5 h-3.5 text-blue-500" />
            <span>视频流:</span>
            <code className="bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
              -c:v copy ({metadata.videoCodec})
            </code>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>音频流:</span>
            <code className="bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              -c:a copy ({metadata.audioCodec})
            </code>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>无二次编解码损耗 · 极速毫秒级输出</span>
        </div>
      </div>
    </div>
  );
};
