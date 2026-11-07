import React, { useState, useRef, useEffect } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { VideoMetadata } from './VideoMetadataCard';

interface DropZoneProps {
  onVideoLoaded: (file: File | null, src: string, metadata: VideoMetadata) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onVideoLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processVideoFile = (file: File) => {
    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      const width = tempVideo.videoWidth || 1920;
      const height = tempVideo.videoHeight || 1080;
      const duration = tempVideo.duration || 60;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const aspect = `${width / divisor}:${height / divisor}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';

      const rawNativePath = (file as unknown as { path?: string }).path;
      const metadata: VideoMetadata = {
        name: file.name,
        filePath: rawNativePath || undefined,
        size: file.size,
        duration: duration,
        width: width,
        height: height,
        aspectRatio: aspect,
        format: ext.toUpperCase(),
        videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC)',
        audioCodec: 'AAC',
        fps: 30,
      };

      setIsLoading(false);
      onVideoLoaded(file, objectUrl, metadata);
    };

    tempVideo.onerror = () => {
      setIsLoading(false);
      const rawNativePath = (file as unknown as { path?: string }).path;
      const metadata: VideoMetadata = {
        name: file.name,
        filePath: rawNativePath || undefined,
        size: file.size,
        duration: 120,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        format: file.name.split('.').pop()?.toUpperCase() || 'MP4',
        videoCodec: 'H.264',
        audioCodec: 'AAC',
        fps: 30,
      };
      onVideoLoaded(file, objectUrl, metadata);
    };
  };

  const processNativeVideoPath = (filePath: string, fileName: string) => {
    setIsLoading(true);
    const fileUrl = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = fileUrl;

    tempVideo.onloadedmetadata = () => {
      const width = tempVideo.videoWidth || 1920;
      const height = tempVideo.videoHeight || 1080;
      const duration = tempVideo.duration || 60;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const aspect = `${width / divisor}:${height / divisor}`;
      const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';

      const metadata: VideoMetadata = {
        name: fileName,
        filePath: filePath,
        size: 0,
        duration: duration,
        width: width,
        height: height,
        aspectRatio: aspect,
        format: ext.toUpperCase(),
        videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC)',
        audioCodec: 'AAC',
        fps: 30,
      };

      setIsLoading(false);
      onVideoLoaded(null, fileUrl, metadata);
    };

    tempVideo.onerror = () => {
      setIsLoading(false);
      const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
      const metadata: VideoMetadata = {
        name: fileName,
        filePath: filePath,
        size: 0,
        duration: 60,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        format: ext.toUpperCase(),
        videoCodec: 'H.264',
        audioCodec: 'AAC',
        fps: 30,
      };
      onVideoLoaded(null, fileUrl, metadata);
    };
  };

  useEffect(() => {
    const win = window as unknown as {
      onNativeVideoFileDropped?: (path: string, name: string) => void;
      onNativeVideoFileSelected?: (path: string, name: string) => void;
    };
    win.onNativeVideoFileDropped = (path: string, name: string) => {
      processNativeVideoPath(path, name);
    };
    win.onNativeVideoFileSelected = (path: string, name: string) => {
      processNativeVideoPath(path, name);
    };
  }, []);

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
      if (file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts)$/i.test(file.name)) {
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
      className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
        isDragging
          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 scale-[1.01]'
          : 'border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/80 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 shadow-xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v,.ts"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center shadow-xs border border-pink-100 dark:border-pink-800/40">
        {isLoading ? (
          <div className="w-7 h-7 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-7 h-7" />
        )}
      </div>

      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          拖入视频文件到此处，或点击浏览选择视频
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          支持 MP4, MOV, MKV, WebM, M4V, TS 等常见音视频格式
        </p>
      </div>

      <button
        type="button"
        className="mt-1 px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer pointer-events-none"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        <span>选择视频文件</span>
      </button>
    </div>
  );
};
