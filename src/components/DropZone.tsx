import React, { useState, useRef, useEffect } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { VideoMetadata } from './VideoMetadataCard';

interface DropZoneProps {
  onVideoLoaded: (file: File | null, src: string, metadata: VideoMetadata) => void;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ onVideoLoaded, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processVideoFile = (file: File) => {
    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const rawNativePath = (file as unknown as { path?: string }).path;

    // 立即构造初始元数据并切换界面，绝不在后台挂起阻塞用户操作
    const metadata: VideoMetadata = {
      name: file.name,
      filePath: rawNativePath || undefined,
      size: file.size,
      duration: 60, // 初始值，由主播放器 onLoadedMetadata 精准更新
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      format: ext.toUpperCase(),
      videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC)',
      audioCodec: 'AAC',
      fps: 30,
    };

    setIsLoading(false);
    onVideoLoaded(file, objectUrl, metadata);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts|wmv|3gp|mpeg|mpg|m2ts)$/i.test(file.name)) {
        processVideoFile(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processVideoFile(e.target.files[0]);
    }
  };

  const handleOpenClick = () => {
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'selectVideoFile' });
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleOpenClick}
      className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-5 w-full ${className} ${
        isDragging
          ? 'border-pink-500 bg-pink-50/70 dark:bg-pink-950/30 scale-[1.008] shadow-lg shadow-pink-500/10 ring-4 ring-pink-500/15'
          : 'border-neutral-300 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-900/80 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-50/20 dark:hover:bg-neutral-850 shadow-xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v,.ts,.wmv,.3gp,.mpeg,.mpg,.m2ts"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="w-20 h-20 rounded-3xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center shadow-xs border border-pink-100 dark:border-pink-800/50 transition-transform group-hover:scale-105">
        {isLoading ? (
          <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-9 h-9" />
        )}
      </div>

      <div className="flex flex-col gap-1.5 max-w-lg">
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
          拖入视频文件到此处，或点击浏览选择视频
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          支持 MP4, MOV, MKV, WebM, M4V, TS, AVI 等几乎所有常见音视频格式
        </p>
      </div>

      <button
        type="button"
        className="mt-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer pointer-events-none"
      >
        <FolderOpen className="w-4 h-4" />
        <span>选择本地视频文件</span>
      </button>
    </div>
  );
};
