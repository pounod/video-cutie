import React from 'react';
import { Film, Zap, FileText } from 'lucide-react';
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
  filePath?: string;
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
    <div className="bg-white dark:bg-neutral-900/80 rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-pink-500" />
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            原视频流参数检测
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Zap className="w-3.5 h-3.5" />
          <span>无损流复制 (-c:v copy -c:a copy)</span>
        </div>
      </div>

      {/* Grid of metadata items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/80">
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">分辨率 / 画面比</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {metadata.width} × {metadata.height}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {metadata.aspectRatio} · {metadata.videoCodec}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/80">
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">完整时长 / 帧率</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {formatSecondsToHHMMSS(metadata.duration)}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            ~{metadata.fps} fps ({metadata.duration.toFixed(2)}s)
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/80">
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">原文件大小 / 封装</span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={metadata.name}>
            {formatFileSize(metadata.size)}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono uppercase">
            {metadata.format || 'MP4'} · {metadata.audioCodec}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-pink-50/60 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50">
          <span className="text-pink-700 dark:text-pink-400 text-[11px]">裁剪预计大小</span>
          <span className="font-mono font-bold text-pink-900 dark:text-pink-200">
            ~{formatFileSize(estimatedOutputSize)}
          </span>
          <span className="text-[11px] text-pink-600 dark:text-pink-400/80 font-mono">
            无二次转码 · 原画输出
          </span>
        </div>
      </div>

      {/* File Path indicator if loaded from disk */}
      {metadata.filePath && (
        <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800/80 rounded-lg border border-neutral-200/60 dark:border-neutral-700/80 text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-neutral-400 shrink-0">源文件路径:</span>
          <span className="text-neutral-800 dark:text-neutral-200 truncate">{metadata.filePath}</span>
        </div>
      )}
    </div>
  );
};
