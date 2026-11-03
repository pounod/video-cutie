import React, { useState, useRef, useEffect } from 'react';
import { MacTitleBar } from './components/MacTitleBar';
import { DropZone } from './components/DropZone';
import { TimelineScrubber } from './components/TimelineScrubber';
import { TimeInputBox } from './components/TimeInputBox';
import { VideoMetadataCard, VideoMetadata } from './components/VideoMetadataCard';
import { TerminalPanel } from './components/TerminalPanel';
import { DmgInstallerModal } from './components/DmgInstallerModal';
import { GitHubActionsModal } from './components/GitHubActionsModal';
import { TechSpecsModal } from './components/TechSpecsModal';
import { AboutModal } from './components/AboutModal';
import { formatSecondsToHHMMSS } from './utils/timeFormat';
import { TrimConfig, generateMacOSShellScript } from './utils/ffmpegHelper';
import { downloadFile, APP_INFO } from './utils/dmgGenerator';
import { Copy, Download, RefreshCw, Scissors, Terminal, Check, FileVideo, HardDrive, GitBranch } from 'lucide-react';

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

  // Active Navigation Tab: trimmer | terminal | dmg | actions | specs
  const [activeTab, setActiveTab] = useState<'trimmer' | 'terminal' | 'dmg' | 'actions' | 'specs'>('trimmer');
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

  // Trimming Time State (Requirement 2 & 3)
  // If omitted, start defaults to 0 ("00:00:00"), end defaults to total video duration
  const [startTimeStr, setStartTimeStr] = useState<string>('00:00:00');
  const [endTimeStr, setEndTimeStr] = useState<string>('00:00:00');
  const [startSeconds, setStartSeconds] = useState<number>(0);
  const [endSeconds, setEndSeconds] = useState<number>(0);

  // Copy Feedback
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

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

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // If looping trimmed clip and reaches endSeconds
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

    // Initialize Trimming bounds:
    // Requirement 2: 省略则开始时间默认为0，结束时间默认为视频播放的最长时间
    const initialStartSecs = 0;
    const initialEndSecs = Math.max(0.1, meta.duration);

    setStartSeconds(initialStartSecs);
    setStartTimeStr('00:00:00');

    setEndSeconds(initialEndSecs);
    setEndTimeStr(formatSecondsToHHMMSS(initialEndSecs));

    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // If at end, wrap to start
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
  };

  // Prepare current TrimConfig
  const totalDur = metadata?.duration || 0;
  const safeStart = Math.min(startSeconds, endSeconds);
  const safeEnd = Math.max(startSeconds, endSeconds);
  const clipDuration = Math.max(0, safeEnd - safeStart);

  const currentConfig: TrimConfig = {
    inputFileName: metadata?.name || 'input_video.mp4',
    outputFileName: metadata
      ? `${metadata.name.replace(/\.[^/.]+$/, '')}_trimmed.mp4`
      : 'output_trimmed.mp4',
    startTime: startTimeStr || '00:00:00',
    endTime: endTimeStr || (metadata ? formatSecondsToHHMMSS(metadata.duration) : '00:00:00'),
    startSeconds: safeStart,
    endSeconds: safeEnd,
  };

  const copyCommandText = `ffmpeg -ss ${currentConfig.startTime} -to ${currentConfig.endTime} -i "${currentConfig.inputFileName}" -c:v copy -c:a copy -avoid_negative_ts make_zero "${currentConfig.outputFileName}"`;

  const handleQuickCopyCommand = () => {
    navigator.clipboard.writeText(copyCommandText);
    setCopiedNotification('已复制 FFmpeg 终端无损裁剪命令');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleDownloadShellScript = () => {
    const script = generateMacOSShellScript(currentConfig);
    downloadFile('trim_lossless.sh', script, 'text/x-sh');
    setCopiedNotification('已下载 macOS 极速裁剪执行脚本 (.sh)');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-pink-500 selection:text-white">
      {/* macOS Window Frame & Titlebar */}
      <MacTitleBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* TAB 1: VIDEO TRIMMER STUDIO */}
        {activeTab === 'trimmer' && (
          <div className="flex flex-col gap-6">
            {!videoSrc ? (
              // Empty State: Drag & Drop Video
              <div className="flex flex-col gap-6 my-auto pt-4">
                {/* Hero Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 bg-white/70 dark:bg-neutral-900/60 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center gap-4">
                    <img
                      src="/src/assets/images/video_cutie_icon_1793694252197.jpg"
                      alt="视频剪辑姬 App Icon"
                      className="w-16 h-16 rounded-2xl shadow-md ring-1 ring-black/10 dark:ring-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                          {APP_INFO.appNameZh} <span className="font-normal text-sm text-neutral-500">({APP_INFO.appNameEn})</span>
                        </h1>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-800/60">
                          v{APP_INFO.version}
                        </span>
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                          Universal
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        视频音视频流复制无损裁剪 · 零重编码 · 智能时间格式补全 (012536 → 01:25:36) · GitHub Actions 自动发布
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('actions')}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl transition-colors shadow-xs"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>GitHub Actions 构建发布</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('dmg')}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors shadow-xs"
                    >
                      <HardDrive className="w-4 h-4 text-amber-500" />
                      <span>.DMG 安装包</span>
                    </button>
                  </div>
                </div>

                {/* Drop Zone with sample video presets */}
                <DropZone onVideoLoaded={handleVideoLoaded} />
              </div>
            ) : (
              // Active Trimming Studio View
              <div className="flex flex-col gap-5">
                {/* Top Video Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900/80 rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                      <FileVideo className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-sm">
                        {metadata?.name}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {metadata?.width}×{metadata?.height} · {metadata?.format} · 时长 {formatSecondsToHHMMSS(totalDur)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetVideo}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>更换视频</span>
                    </button>
                  </div>
                </div>

                {/* Video Player & Dual-Handle Range Scrubber */}
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

                {/* Requirement 2 & 3: Start Time & End Time Inputs with 012536 Auto-completion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Time Box */}
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

                  {/* End Time Box */}
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

                {/* Clip Action Bar */}
                <div className="p-4 bg-white dark:bg-neutral-900/80 rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">输出片段时长:</span>
                      <span className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formatSecondsToHHMMSS(clipDuration)}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      区间: {startTimeStr} → {endTimeStr} · 音视频流直接拷贝 (-c copy)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleQuickCopyCommand}
                      className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold shadow-xs transition-all hover:scale-[1.01]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制 FFmpeg 终端指令</span>
                    </button>

                    <button
                      onClick={handleDownloadShellScript}
                      className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>下载极速执行脚本 (.sh)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('terminal')}
                      className="flex items-center gap-1.5 px-3 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                      <span>终端详情</span>
                    </button>
                  </div>
                </div>

                {/* Copied Alert Toast */}
                {copiedNotification && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{copiedNotification}</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      可在 macOS 终端直接 Command+V 粘贴执行
                    </span>
                  </div>
                )}

                {/* Video Metadata & Stream Copy Specs */}
                <VideoMetadataCard metadata={metadata} clipDuration={clipDuration} />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FFMPEG TERMINAL & BASH SCRIPTS */}
        {activeTab === 'terminal' && (
          <TerminalPanel config={currentConfig} />
        )}

        {/* TAB 3: MACOS UNIVERSAL DMG INSTALLER CENTER */}
        {activeTab === 'dmg' && (
          <DmgInstallerModal onGoToActions={() => setActiveTab('actions')} />
        )}

        {/* TAB 4: GITHUB ACTIONS CI/CD & RELEASES HUB */}
        {activeTab === 'actions' && (
          <GitHubActionsModal />
        )}

        {/* TAB 5: TECHNICAL SPECS & STREAM COPY */}
        {activeTab === 'specs' && (
          <TechSpecsModal />
        )}
      </main>

      {/* Quiet macOS Footer */}
      <footer className="mt-auto px-4 py-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/60 dark:bg-neutral-900/60 text-center text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-between gap-3 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{APP_INFO.appNameZh} ({APP_INFO.appNameEn})</span>
          <span>v{APP_INFO.version}</span>
          <span>·</span>
          <span>Apple Silicon (M1~M4) & Intel x86_64</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button onClick={() => setActiveTab('trimmer')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            视频裁剪
          </button>
          <button onClick={() => setActiveTab('terminal')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            FFmpeg 终端
          </button>
          <button onClick={() => setActiveTab('dmg')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            DMG 安装包
          </button>
          <button onClick={() => setActiveTab('actions')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            GitHub Actions 发布
          </button>
          <button onClick={() => setActiveTab('specs')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            技术规范
          </button>
          <button onClick={() => setIsAboutOpen(true)} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            关于
          </button>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
