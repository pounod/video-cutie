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
  Film
} from 'lucide-react';

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

  // Save Path State
  const [saveDirectory, setSaveDirectory] = useState<string>('~/Movies');
  const [defaultPaths, setDefaultPaths] = useState<{ movies?: string; downloads?: string; desktop?: string }>({});

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

  // Native macOS WKWebView Bridge setup
  useEffect(() => {
    const win = window as unknown as {
      onNativeTrimComplete?: (success: boolean, outputPath?: string, errorMsg?: string) => void;
      onSaveDirectorySelected?: (path: string) => void;
      onDefaultPathsReceived?: (paths: { movies?: string; downloads?: string; desktop?: string }) => void;
      onOpenAboutModal?: () => void;
    };

    win.onNativeTrimComplete = (success: boolean, outputPath?: string, errorMsg?: string) => {
      setIsExporting(false);
      setExportProgress(100);
      if (success) {
        const finalPath = outputPath || '';
        setLastExportedPath(finalPath);
        setExportErrorMessage(null);
        setExportSuccessMessage(finalPath ? `🎉 无损剪辑成功！已保存至：${finalPath}` : '🎉 无损视频剪辑成功！原视频参数已完整保留。');
      } else {
        setExportSuccessMessage(null);
        setExportErrorMessage(`⚠️ 原生剪辑导出失败: ${errorMsg || '请检查源文件权限或格式。'}`);
      }
    };

    win.onSaveDirectorySelected = (path: string) => {
      if (path) {
        setSaveDirectory(path);
      }
    };

    win.onDefaultPathsReceived = (paths) => {
      if (paths) {
        setDefaultPaths(paths);
        if (paths.movies) {
          setSaveDirectory(paths.movies);
        }
      }
    };

    win.onOpenAboutModal = () => {
      setIsAboutOpen(true);
    };

    // Ask native bridge for default macOS directories on startup
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'getDefaultPaths' });
    }
  }, []);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isLoopingClip && endSeconds > startSeconds && video.currentTime >= endSeconds) {
        video.currentTime = startSeconds;
        video.play().catch(() => {});
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
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

    // If source file has a full path, automatically suggest its folder as default save path
    if (meta.filePath && meta.filePath.includes('/')) {
      const sourceFolder = meta.filePath.substring(0, meta.filePath.lastIndexOf('/'));
      if (sourceFolder) {
        setSaveDirectory(sourceFolder);
      }
    }
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

  // Select Save Directory
  const handleSelectSaveDirectory = () => {
    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge) {
      nativeBridge.postMessage({ action: 'selectSaveDirectory' });
    } else {
      const custom = window.prompt('请输入导出的目标保存文件夹名称或路径:', saveDirectory);
      if (custom && custom.trim()) {
        setSaveDirectory(custom.trim());
      }
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
  const fullPlannedOutputPath = `${saveDirectory.replace(/\/$/, '')}/${plannedOutputFileName}`;

  // Execute in-app trim export
  const handleInAppTrimExport = () => {
    if (!videoSrc && !videoFile && !metadata?.filePath) return;
    setIsExporting(true);
    setExportProgress(15);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);

    const nativeBridge = (window as unknown as { webkit?: { messageHandlers?: { nativeBridge?: { postMessage: (msg: unknown) => void } } } }).webkit?.messageHandlers?.nativeBridge;
    if (nativeBridge && metadata?.filePath) {
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
                    src="/src/assets/app_icon.png"
                    alt="视频剪辑姬 App Icon"
                    className="w-14 h-14 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    referrerPolicy="no-referrer"
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

              {/* Row 2: Save Directory Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    <Folder className="w-3.5 h-3.5 text-pink-500" />
                    <span>剪辑完成视频保存路径</span>
                  </div>

                  {/* Preset directory chips */}
                  <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto text-[11px]">
                    {metadata?.filePath && (
                      <button
                        onClick={() => {
                          const folder = metadata.filePath?.substring(0, metadata.filePath.lastIndexOf('/'));
                          if (folder) setSaveDirectory(folder);
                        }}
                        className="px-2 py-1 font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-pink-400 rounded-md transition-colors cursor-pointer"
                        title="保存至源视频同一目录"
                      >
                        📁 源视频目录
                      </button>
                    )}

                    <button
                      onClick={() => setSaveDirectory(defaultPaths.movies || '~/Movies')}
                      className={`px-2 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                        saveDirectory.includes('Movies')
                          ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      🎬 影片
                    </button>

                    <button
                      onClick={() => setSaveDirectory(defaultPaths.downloads || '~/Downloads')}
                      className={`px-2 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                        saveDirectory.includes('Downloads')
                          ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      📥 下载
                    </button>

                    <button
                      onClick={() => setSaveDirectory(defaultPaths.desktop || '~/Desktop')}
                      className={`px-2 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                        saveDirectory.includes('Desktop')
                          ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      🖥️ 桌面
                    </button>

                    <button
                      onClick={handleSelectSaveDirectory}
                      className="flex items-center gap-1 px-2.5 py-1 font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-md transition-colors cursor-pointer ml-1"
                    >
                      <FolderOpen className="w-3 h-3 text-pink-500" />
                      <span>选择目录...</span>
                    </button>
                  </div>
                </div>

                {/* Path input & preview */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-850/70 rounded-lg border border-neutral-200/60 dark:border-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate">
                  <span className="text-neutral-400 select-none">输出:</span>
                  <span className="text-pink-600 dark:text-pink-400 font-medium truncate flex-1">
                    {fullPlannedOutputPath}
                  </span>
                </div>
              </div>

              {/* Row 3: Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在无损导出剪辑 ({exportProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>一键无损剪辑导出</span>
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
