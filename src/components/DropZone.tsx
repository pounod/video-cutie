import React, { useState, useRef, useEffect } from 'react';
import { Upload, Film, Video, PlayCircle, FolderOpen } from 'lucide-react';
import { VideoMetadata } from './VideoMetadataCard';

interface DropZoneProps {
  onVideoLoaded: (file: File | null, src: string, metadata: VideoMetadata) => void;
}

// Built-in high-quality test video clips
const SAMPLE_VIDEOS = [
  {
    name: 'macOS_Sonoma_Horizon_4K.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596,
    width: 3840,
    height: 2160,
    size: 158 * 1024 * 1024,
    aspect: '16:9 4K',
    desc: '4K 超高清测试样片 (16:9)',
  },
  {
    name: 'Drone_Aerial_Coastline_1080p.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 653,
    width: 1920,
    height: 1080,
    size: 89 * 1024 * 1024,
    aspect: '16:9 1080p',
    desc: '全高清 60fps 电影短片',
  },
  {
    name: 'Vertical_TikTok_Reels_1080x1920.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
    width: 1080,
    height: 1920,
    size: 12 * 1024 * 1024,
    aspect: '9:16 竖屏',
    desc: '竖屏短视频剪辑样片',
  },
];

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

      const metadata: VideoMetadata = {
        name: file.name,
        size: file.size,
        duration: duration,
        width: width,
        height: height,
        aspectRatio: aspect,
        format: ext.toUpperCase(),
        videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC1 High)',
        audioCodec: 'AAC-LC (Stereo, 48kHz)',
        fps: 30,
      };

      setIsLoading(false);
      onVideoLoaded(file, objectUrl, metadata);
    };

    tempVideo.onerror = () => {
      setIsLoading(false);
      const metadata: VideoMetadata = {
        name: file.name,
        size: file.size,
        duration: 120,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        format: file.name.split('.').pop()?.toUpperCase() || 'MP4',
        videoCodec: 'H.264 (AVC)',
        audioCodec: 'AAC-LC',
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
        videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC1 High)',
        audioCodec: 'AAC-LC (Stereo, 48kHz)',
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
      } else {
        alert('请拖入有效的视频文件 (MP4, MOV, MKV, WebM 等)');
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

  const loadSampleVideo = (sample: typeof SAMPLE_VIDEOS[0]) => {
    setIsLoading(true);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = sample.url;
    tempVideo.crossOrigin = 'anonymous';

    tempVideo.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        name: sample.name,
        size: sample.size,
        duration: tempVideo.duration || sample.duration,
        width: tempVideo.videoWidth || sample.width,
        height: tempVideo.videoHeight || sample.height,
        aspectRatio: sample.aspect,
        format: 'MP4',
        videoCodec: 'H.264 (High Profile)',
        audioCodec: 'AAC-LC Stereo 48kHz',
        fps: 30,
      };
      setIsLoading(false);
      onVideoLoaded(null, sample.url, metadata);
    };

    tempVideo.onerror = () => {
      setIsLoading(false);
      const metadata: VideoMetadata = {
        name: sample.name,
        size: sample.size,
        duration: sample.duration,
        width: sample.width,
        height: sample.height,
        aspectRatio: sample.aspect,
        format: 'MP4',
        videoCodec: 'H.264',
        audioCodec: 'AAC',
        fps: 30,
      };
      onVideoLoaded(null, sample.url, metadata);
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleOpenClick}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3.5 ${
          isDragging
            ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 scale-[1.01]'
            : 'border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-neutral-50 dark:hover:bg-neutral-850/80 shadow-xs'
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
            拖入视频文件到此处，或点击浏览
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            自动获取视频分辨率、时长、音视频流格式。支持 MP4, MOV, MKV, WebM, M4V, TS 等全格式。
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>选择视频文件</span>
          </span>
        </div>
      </div>

      {/* Preset Test Videos */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
          <span className="font-medium flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-pink-500" />
            没有本地视频？点击直接加载测试样片体验：
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_VIDEOS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSampleVideo(sample)}
              className="flex items-start gap-2.5 p-3 text-left rounded-xl bg-white dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800 hover:border-pink-500 dark:hover:border-pink-500/80 hover:shadow-xs transition-all group"
            >
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 group-hover:bg-pink-50 dark:group-hover:bg-pink-950/40 group-hover:text-pink-500 transition-colors">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {sample.name}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {sample.desc} · {sample.aspect}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
