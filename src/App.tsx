import React, { useState, useRef, useEffect } from 'react';
import { MacTitleBar } from './components/MacTitleBar';
import { DropZone } from './components/DropZone';
import { TimelineScrubber } from './components/TimelineScrubber';
import { TimeInputBox } from './components/TimeInputBox';
import { VideoMetadataCard, VideoMetadata } from './components/VideoMetadataCard';
import { AboutModal } from './components/AboutModal';
import { formatSecondsToHHMMSS } from './utils/timeFormat';
import { APP_INFO } from './utils/dmgGenerator';
import { 
  RefreshCw, 
  Scissors, 
  Check, 
  FileVideo, 
  Folder, 
  FolderOpen, 
  FolderCheck,
  AlertCircle,
  Zap,
  Film,
  ShieldCheck,
  Key
} from 'lucide-react';
import appIcon from './assets/app_icon.png';

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videocutie_theme');
      if (saved) return saved === 'dark';
      return true; // Default to dark mode for macOS media editing
    }
    return true;
  });

  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Video State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Player State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoopingClip, setIsLoopingClip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Trimming Time State
  const [startTimeStr, setStartTimeStr] = useState<string>('00:00:00');
  const [endTimeStr, setEndTimeStr] = useState<string>('00:00:00');
  const [startSeconds, setStartSeconds] = useState<number>(0);
  const [endSeconds, setEndSeconds] = useState<number>(0);

  // Save Path State - Persisted in localStorage so it stays active unless modified
  const [saveDirectory, setSaveDirectory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videocutie_save_directory');
      if (saved && saved.trim()) return saved.trim();
    }
    return '~/Movies';
  });
  const [defaultPaths, setDefaultPaths] = useState<{ movies?: string; downloads?: string; desktop?: string }>({});
  const [hasFolderPermission, setHasFolderPermission] = useState<boolean | null>(null);

  const updateSaveDirectory = (newPath: string) => {
    if (!newPath || !newPath.trim()) return;
    const cleanPath = newPath.trim();
    setSaveDirectory(cleanPath);
    if (typeof window !== 'undefined') {
      localStorage.setItem('videocutie_save_directory', cleanPath);
    }
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'checkFolderPermission', path: cleanPath });
    }
  };

  // In-App Trimming & Export Progress State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [lastExportedPath, setLastExportedPath] = useState<string | null>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('videocutie_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('videocutie_theme', 'light');
    }
  }, [isDarkMode]);

  // System Dark Mode synchronization with macOS appearance
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      // If user hasn't explicitly set a custom theme in localStorage, sync with system
      const saved = localStorage.getItem('videocutie_theme');
      if (!saved) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  // Native macOS WKWebView Bridge setup
  useEffect(() => {
    const win = window as unknown as {
      onNativeTrimComplete?: (success: boolean, outputPath?: string, errorMsg?: string) => void;
      onSaveDirectorySelected?: (path: string) => void;
      onFolderPermissionGranted?: (path: string, granted: boolean) => void;
      onFolderPermissionChecked?: (path: string, writable: boolean) => void;
      onDefaultPathsReceived?: (paths: { movies?: string; downloads?: string; desktop?: string }) => void;
      onOpenAboutModal?: () => void;
      onSystemThemeChanged?: (isDark: boolean) => void;
      onNativeVideoFileDropped?: (path: string, name: string) => void;
      onNativeVideoFileSelected?: (path: string, name: string) => void;
    };

    win.onSystemThemeChanged = (isDark: boolean) => {
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    win.onNativeVideoFileDropped = (path: string, name: string) => {
      loadNativeVideoFile(path, name);
    };

    win.onNativeVideoFileSelected = (path: string, name: string) => {
      loadNativeVideoFile(path, name);
    };

    win.onNativeTrimComplete = (success: boolean, outputPath?: string, errorMsg?: string) => {
      setIsExporting(false);
      setExportProgress(100);
      if (success) {
        const finalPath = outputPath || '';
        setLastExportedPath(finalPath);
        setExportErrorMessage(null);
        setExportSuccessMessage(finalPath ? `🎉 无损剪辑成功！已保存至设定的路径：${finalPath}` : '🎉 无损视频剪辑成功！已保存至设定的目标文件夹。');
      } else {
        setExportSuccessMessage(null);
        setExportErrorMessage(`⚠️ 原生剪辑导出失败: ${errorMsg || '请检查源文件权限或格式。'}`);
      }
    };

    win.onSaveDirectorySelected = (path: string) => {
      if (path) {
        updateSaveDirectory(path);
      }
    };

    win.onFolderPermissionGranted = (path: string, granted: boolean) => {
      setHasFolderPermission(granted);
      if (path) {
        updateSaveDirectory(path);
      }
    };

    win.onFolderPermissionChecked = (_path: string, writable: boolean) => {
      setHasFolderPermission(writable);
    };

    win.onDefaultPathsReceived = (paths) => {
      if (paths) {
        setDefaultPaths(paths);
        // Only set default if user hasn't configured a custom directory yet
        const saved = typeof window !== 'undefined' ? localStorage.getItem('videocutie_save_directory') : null;
        if (!saved && paths.movies) {
          updateSaveDirectory(paths.movies);
        } else if (saved === '~/Movies' && paths.movies) {
          updateSaveDirectory(paths.movies);
        }
      }
    };

    win.onOpenAboutModal = () => {
      setIsAboutOpen(true);
    };

    // Ask native bridge for default macOS directories, permission status and current system theme on startup
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'getDefaultPaths' });
      nativeBridge.postMessage({ action: 'getSystemTheme' });
      const currentDir = typeof window !== 'undefined' ? localStorage.getItem('videocutie_save_directory') || '~/Movies' : '~/Movies';
      nativeBridge.postMessage({ action: 'checkFolderPermission', path: currentDir });
    }
  }, []);

  // Handler for native video files dropped into the window or selected via NSOpenPanel
  const loadNativeVideoFile = (filePath: string, fileName: string) => {
    const isCustomScheme = window.location.protocol === 'app:';
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    // 对路径进行安全 URI 编码以支持中文及空格，同时原生 local-file 处理器支持分片 Range 播放
    const fileUrl = isCustomScheme 
      ? `app://local-file${encodeURI(cleanPath)}` 
      : (filePath.startsWith('file://') ? filePath : `file://${filePath}`);

    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const meta: VideoMetadata = {
      name: fileName,
      filePath: filePath, // REAL ABSOLUTE PATH FOR FFmpeg!
      size: 0,
      duration: 60, // 初始时长，主播放器加载后立即精准更新
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      format: ext.toUpperCase(),
      videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC)',
      audioCodec: 'AAC',
      fps: 30,
    };

    // 关键优化：无需等待未挂载的离屏 video 对象，立即切换至剪辑界面，确保用户拖入或选取文件有即时响应与界面变化！
    handleVideoLoaded(null, fileUrl, meta);
  };

  // 全局窗口拖拽捕获：无论拖到客户端窗口的任意位置均能立即添加视频
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts|wmv|3gp|mpeg|mpg|m2ts)$/i.test(file.name);
        if (isVideo) {
          const rawNativePath = (file as unknown as { path?: string }).path;
          if (rawNativePath) {
            loadNativeVideoFile(rawNativePath, file.name);
          } else {
            const objectUrl = URL.createObjectURL(file);
            const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
            const meta: VideoMetadata = {
              name: file.name,
              filePath: undefined,
              size: file.size,
              duration: 60,
              width: 1920,
              height: 1080,
              aspectRatio: '16:9',
              format: ext.toUpperCase(),
              videoCodec: ext === 'mov' ? 'ProRes / H.264' : 'H.264 (AVC)',
              audioCodec: 'AAC',
              fps: 30,
            };
            handleVideoLoaded(file, objectUrl, meta);
          }
        }
      }
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const d = video.duration;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (d && !isNaN(d) && isFinite(d) && d > 0) {
        setEndSeconds(d);
        setEndTimeStr(formatSecondsToHHMMSS(d));
        setMetadata(prev => prev ? {
          ...prev,
          duration: d,
          width: w || prev.width,
          height: h || prev.height,
          aspectRatio: (w && h) ? `${w}:${h}` : prev.aspectRatio
        } : null);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isLoopingClip && endSeconds > startSeconds && video.currentTime >= endSeconds) {
        video.currentTime = startSeconds;
        video.play().catch(() => {});
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isLoopingClip, startSeconds, endSeconds]);

  // Load Video Handler
  const handleVideoLoaded = (file: File | null, src: string, meta: VideoMetadata) => {
    setVideoFile(file);
    setVideoSrc(src);
    setMetadata(meta);

    const initialStartSecs = 0;
    const initialEndSecs = Math.max(0.1, meta.duration);

    setStartSeconds(initialStartSecs);
    setStartTimeStr('00:00:00');

    setEndSeconds(initialEndSecs);
    setEndTimeStr(formatSecondsToHHMMSS(initialEndSecs));

    setCurrentTime(0);
    setIsPlaying(false);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    setLastExportedPath(null);
    // 保持用户设定的保存路径不变（持久生效，除非用户手动点击再次修改）
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (currentTime >= endSeconds || currentTime < startSeconds) {
        videoRef.current.currentTime = startSeconds;
      }
      videoRef.current.play().catch(() => {});
    }
  };

  // Seek To Position
  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  // Dual Range Handle Drag Update
  const handleRangeChange = (newStart: number, newEnd: number) => {
    setStartSeconds(newStart);
    setStartTimeStr(formatSecondsToHHMMSS(newStart));

    setEndSeconds(newEnd);
    setEndTimeStr(formatSecondsToHHMMSS(newEnd));
  };

  // Start Time Changed via Input
  const handleStartTimeChange = (newStr: string, newSec: number) => {
    setStartTimeStr(newStr);
    setStartSeconds(newSec);
    if (newSec > endSeconds && metadata) {
      setEndSeconds(metadata.duration);
      setEndTimeStr(formatSecondsToHHMMSS(metadata.duration));
    }
    handleSeek(newSec);
  };

  // End Time Changed via Input
  const handleEndTimeChange = (newStr: string, newSec: number) => {
    setEndTimeStr(newStr);
    setEndSeconds(newSec);
    if (newSec < startSeconds) {
      setStartSeconds(0);
      setStartTimeStr('00:00:00');
    }
    handleSeek(newSec);
  };

  // Reset Video
  const handleResetVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVideoSrc(null);
    setVideoFile(null);
    setMetadata(null);
    setIsExporting(false);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    setLastExportedPath(null);
  };

  // Select Save Directory (Native Open Panel with Permission)
  const handleSelectSaveDirectory = () => {
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'selectSaveDirectory' });
    } else {
      handleEditPathManually();
    }
  };

  // Request macOS Folder Access Permission
  const handleRequestFolderPermission = () => {
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'requestFolderPermission', path: saveDirectory });
    } else {
      handleSelectSaveDirectory();
    }
  };

  // Edit Path Manually (Prompt input)
  const handleEditPathManually = () => {
    const custom = window.prompt('修改视频保存文件夹路径 (一直有效，除非再次修改):', saveDirectory);
    if (custom && custom.trim()) {
      updateSaveDirectory(custom.trim());
    }
  };

  // Reveal exported file in macOS Finder
  const handleRevealInFinder = () => {
    if (!lastExportedPath) return;
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'revealInFinder', path: lastExportedPath });
    }
  };

  // Calculate planned output filename
  const rawFileName = metadata?.name || 'video.mp4';
  const dotIdx = rawFileName.lastIndexOf('.');
  const baseName = dotIdx > 0 ? rawFileName.substring(0, dotIdx) : rawFileName;
  const extension = dotIdx > 0 ? rawFileName.substring(dotIdx) : '.mp4';
  const plannedOutputFileName = `${baseName}_cut_${startTimeStr.replace(/:/g, '')}_${endTimeStr.replace(/:/g, '')}${extension}`;
  const cleanSaveDir = (saveDirectory && saveDirectory.trim()) || defaultPaths.movies || '~/Movies';
  const fullPlannedOutputPath = `${cleanSaveDir.replace(/\/+$/, '')}/${plannedOutputFileName}`;

  // Execute in-app trim export
  const handleInAppTrimExport = () => {
    if (!videoSrc && !videoFile && !metadata?.filePath) return;
    setIsExporting(true);
    setExportProgress(15);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);

    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      if (!metadata?.filePath) {
        setIsExporting(false);
        setExportErrorMessage('⚠️ 客户端未能定位到该视频在 macOS 系统上的绝对路径。请点击“更换视频”重新选取文件后导出。');
        return;
      }
      setExportProgress(35);
      nativeBridge.postMessage({
        action: 'executeTrim',
        input: metadata.filePath,
        output: fullPlannedOutputPath,
        start: startTimeStr,
        end: endTimeStr
      });
      return;
    }

    // Web simulation fallback if opened in browser preview
    let p = 20;
    const timer = setInterval(() => {
      p += 25;
      if (p >= 100) {
        clearInterval(timer);
        setIsExporting(false);
        setExportProgress(100);
        setLastExportedPath(fullPlannedOutputPath);
        setExportSuccessMessage(`🎉 剪辑完成！导出的视频已保存至：${fullPlannedOutputPath}`);
      } else {
        setExportProgress(p);
      }
    }, 350);
  };

  const totalDur = metadata?.duration || 60;
  const clipDuration = Math.max(0, endSeconds - startSeconds);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 transition-colors font-sans select-none antialiased">
      {/* Native-integrated macOS Title Bar */}
      <MacTitleBar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Area - Streamlined without multi-layer box nesting */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-5 flex flex-col gap-4">
        {!videoSrc ? (
          // Unified Empty State: Clean Drop Canvas without redundant nested card wrappers
          <div className="flex-1 flex flex-col justify-center my-auto py-4">
            <div className="flex flex-col gap-5">
              {/* Clean App Header Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3.5">
                  <img
                    src={appIcon}
                    alt="视频剪辑姬 App Icon"
                    className="w-14 h-14 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {APP_INFO.appNameZh} <span className="font-normal text-sm text-neutral-500">({APP_INFO.appNameEn})</span>
                      </h1>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-800/60">
                        v{APP_INFO.version}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      内置 FFmpeg 引擎 · 原画音视频流复制无损裁剪 · 智能时间格式补全 (输入 012536 自动补全为 01:25:36)
                    </p>
                  </div>
                </div>
              </div>

              {/* Drop Canvas */}
              <DropZone onVideoLoaded={handleVideoLoaded} />

              {/* Current Configured Save Path Display (Prominently visible and persistent with macOS permission application) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white/90 dark:bg-neutral-900/90 rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                  <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 shrink-0">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        当前设定的保存路径：
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        持续生效
                      </span>

                      {/* macOS Folder Access Permission Application Badge */}
                      {hasFolderPermission === true ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1" title="macOS 文件夹读写访问权限已授权">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          已授权访问
                        </span>
                      ) : hasFolderPermission === false ? (
                        <button
                          onClick={handleRequestFolderPermission}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1 transition-colors cursor-pointer"
                          title="点击向 macOS 系统申请目标文件夹的读写访问权限"
                        >
                          <Key className="w-3 h-3 text-amber-500" />
                          申请文件夹权限
                        </button>
                      ) : (
                        <button
                          onClick={handleRequestFolderPermission}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="向 macOS 申请该目录读写权限"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          申请授权
                        </button>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400 truncate mt-0.5" title={saveDirectory}>
                      {saveDirectory || '~/Movies'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end overflow-x-auto text-xs">
                  {hasFolderPermission !== true && (
                    <button
                      onClick={handleRequestFolderPermission}
                      className="flex items-center gap-1 px-2.5 py-1.5 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/80 dark:border-amber-700/80 rounded-lg transition-colors cursor-pointer"
                      title="向 macOS 申请设定保存路径的系统文件夹访问权限"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>申请权限</span>
                    </button>
                  )}

                  <button
                    onClick={handleSelectSaveDirectory}
                    className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-300/80 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title="选择保存目录"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-pink-500" />
                    <span>选择目录...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Active Studio: Unified Workspace
          <div className="flex flex-col gap-4">
            {/* Top Video Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-sm">
                    {metadata?.name}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    ({metadata?.width}×{metadata?.height} · {metadata?.format} · 总时长 {formatSecondsToHHMMSS(totalDur)})
                  </span>
                </div>
              </div>

              <button
                onClick={handleResetVideo}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>更换视频</span>
              </button>
            </div>

            {/* Video Player & Interactive Scrubber */}
            <TimelineScrubber
              videoRef={videoRef}
              videoSrc={videoSrc}
              videoName={metadata?.name || 'video'}
              totalDuration={totalDur}
              currentTime={currentTime}
              startSeconds={startSeconds}
              endSeconds={endSeconds}
              isPlaying={isPlaying}
              isLoopingClip={isLoopingClip}
              isMuted={isMuted}
              onTogglePlay={togglePlay}
              onToggleLoop={() => setIsLoopingClip(!isLoopingClip)}
              onToggleMute={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              onSeek={handleSeek}
              onRangeChange={handleRangeChange}
            />

            {/* Unified Control Dashboard (Time Range + Save Directory + Export Action) */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs flex flex-col gap-4">
              {/* Row 1: Time Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <TimeInputBox
                  label="裁剪开始时间 (Start Time)"
                  isStartTime={true}
                  timeString={startTimeStr}
                  totalDuration={totalDur}
                  currentPlayheadTime={currentTime}
                  onTimeChange={handleStartTimeChange}
                  onSetToCurrent={() => handleStartTimeChange(formatSecondsToHHMMSS(currentTime), currentTime)}
                  onResetDefault={() => handleStartTimeChange('00:00:00', 0)}
                />

                <TimeInputBox
                  label="裁剪结束时间 (End Time)"
                  isStartTime={false}
                  timeString={endTimeStr}
                  totalDuration={totalDur}
                  currentPlayheadTime={currentTime}
                  onTimeChange={handleEndTimeChange}
                  onSetToCurrent={() => handleEndTimeChange(formatSecondsToHHMMSS(currentTime), currentTime)}
                  onResetDefault={() => handleEndTimeChange(formatSecondsToHHMMSS(totalDur), totalDur)}
                />
              </div>

              {/* Row 2: Save Directory Section (Prominently visible and persistent) */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        当前设定的保存路径：
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        持续生效
                      </span>

                      {/* macOS Folder Access Permission Application Badge */}
                      {hasFolderPermission === true ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1" title="macOS 文件夹读写访问权限已授权">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          已授权访问
                        </span>
                      ) : hasFolderPermission === false ? (
                        <button
                          onClick={handleRequestFolderPermission}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1 transition-colors cursor-pointer"
                          title="点击向 macOS 系统申请目标文件夹的读写访问权限"
                        >
                          <Key className="w-3 h-3 text-amber-500" />
                          申请文件夹权限
                        </button>
                      ) : (
                        <button
                          onClick={handleRequestFolderPermission}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="向 macOS 申请该目录读写权限"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          申请授权
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    {metadata?.filePath && (
                      <button
                        onClick={() => {
                          const folder = metadata.filePath?.substring(0, metadata.filePath.lastIndexOf('/'));
                          if (folder) updateSaveDirectory(folder);
                        }}
                        className="px-2.5 py-1 font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-pink-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-pink-200 dark:hover:border-pink-800 text-[11px]"
                        title="保存至源视频同一目录"
                      >
                        📁 源视频目录
                      </button>
                    )}

                    {hasFolderPermission !== true && (
                      <button
                        onClick={handleRequestFolderPermission}
                        className="flex items-center gap-1 px-2.5 py-1.5 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/80 dark:border-amber-700/80 rounded-lg transition-colors cursor-pointer text-xs"
                        title="向 macOS 系统申请目标文件夹读写访问权限"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>申请权限</span>
                      </button>
                    )}

                    <button
                      onClick={handleSelectSaveDirectory}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-300/80 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="打开 macOS 访达窗口选择目标保存目录并授权"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-pink-500" />
                      <span>选择目录...</span>
                    </button>
                  </div>
                </div>

                {/* Path input & preview */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800/90 rounded-lg border border-neutral-200/70 dark:border-neutral-700/80 text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    <span className="text-neutral-400 select-none shrink-0 font-sans text-[11px]">设定保存目录:</span>
                    <span className="text-pink-600 dark:text-pink-400 font-bold truncate" title={saveDirectory}>
                      {saveDirectory || '~/Movies'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate sm:justify-end border-t sm:border-t-0 sm:border-l border-neutral-200/60 dark:border-neutral-800 pt-1 sm:pt-0 sm:pl-3">
                    <span className="text-neutral-400 select-none shrink-0 font-sans text-[11px]">预计导出文件:</span>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate" title={plannedOutputFileName}>
                      {plannedOutputFileName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">剪辑时长:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                    {formatSecondsToHHMMSS(clipDuration)}
                  </span>
                  <span className="text-neutral-400">({startTimeStr} → {endTimeStr})</span>
                </div>

                <button
                  onClick={handleInAppTrimExport}
                  disabled={isExporting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:via-rose-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-60 text-white rounded-xl text-sm font-extrabold tracking-wide shadow-md shadow-pink-500/25 dark:shadow-pink-950/50 hover:shadow-xl hover:shadow-pink-500/35 border border-white/20 transition-all cursor-pointer group"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>正在无损导出剪辑 ({exportProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4.5 h-4.5 text-white transition-transform group-hover:rotate-12 duration-200" />
                      <span>一键无损剪辑导出</span>
                      <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white/20 text-white rounded-full tracking-normal">
                        原画极速
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Success / Error Alerts */}
              {exportSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{exportSuccessMessage}</span>
                  </div>

                  {lastExportedPath && (
                    <button
                      onClick={handleRevealInFinder}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <FolderCheck className="w-3.5 h-3.5" />
                      <span>在访达中显示</span>
                    </button>
                  )}
                </div>
              )}

              {exportErrorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{exportErrorMessage}</span>
                </div>
              )}

              {/* Stream Copy Specifications Banner */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  <span>无损流复制: 保持原始分辨率、色彩与码率，毫秒级无损极速裁剪 (-c copy)</span>
                </div>
                <span className="font-mono text-neutral-400">内置 FFmpeg 引擎</span>
              </div>
            </div>

            {/* Video Metadata Specifications (Single Sleek Card) */}
            <VideoMetadataCard metadata={metadata} clipDuration={clipDuration} />
          </div>
        )}
      </main>

      {/* Clean Bottom Status Bar */}
      <footer className="mt-auto px-5 py-2.5 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{APP_INFO.appNameZh} ({APP_INFO.appNameEn})</span>
          <span>v{APP_INFO.version}</span>
          <span>·</span>
          <span>Apple Silicon (M1~M4) & Intel x86_64</span>
        </div>

        <button 
          onClick={() => setIsAboutOpen(true)} 
          className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-[11px]"
        >
          关于视频剪辑姬
        </button>
      </footer>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
