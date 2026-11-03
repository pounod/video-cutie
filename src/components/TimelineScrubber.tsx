import React, { useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Repeat } from 'lucide-react';
import { formatSecondsToHHMMSS, formatSecondsToHHMMSSMS } from '../utils/timeFormat';

interface TimelineScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  videoName: string;
  totalDuration: number;
  currentTime: number;
  startSeconds: number;
  endSeconds: number;
  isPlaying: boolean;
  isLoopingClip: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
  onRangeChange: (start: number, end: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  videoRef,
  videoSrc,
  videoName,
  totalDuration,
  currentTime,
  startSeconds,
  endSeconds,
  isPlaying,
  isLoopingClip,
  isMuted,
  onTogglePlay,
  onToggleLoop,
  onToggleMute,
  onSeek,
  onRangeChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingHandle = useRef<'start' | 'end' | 'playhead' | null>(null);

  // Clamp values
  const safeDuration = Math.max(0.1, totalDuration);
  const startPercent = Math.min(100, Math.max(0, (startSeconds / safeDuration) * 100));
  const endPercent = Math.min(100, Math.max(0, (endSeconds / safeDuration) * 100));
  const currentPercent = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  const clipDuration = Math.max(0, endSeconds - startSeconds);

  // Handle click or drag on timeline
  const handlePointerDown = (type: 'start' | 'end' | 'playhead', e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingHandle.current = type;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingHandle.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const targetSec = Math.round(ratio * safeDuration * 100) / 100;

    if (isDraggingHandle.current === 'start') {
      const newStart = Math.min(targetSec, Math.max(0, endSeconds - 0.2));
      onRangeChange(newStart, endSeconds);
      onSeek(newStart);
    } else if (isDraggingHandle.current === 'end') {
      const newEnd = Math.max(targetSec, Math.min(safeDuration, startSeconds + 0.2));
      onRangeChange(startSeconds, newEnd);
      onSeek(newEnd);
    } else if (isDraggingHandle.current === 'playhead') {
      onSeek(targetSec);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingHandle.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }
      isDraggingHandle.current = null;
    }
  };

  // Click on background track seeks playhead
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetSec = (x / rect.width) * safeDuration;
    onSeek(targetSec);
  };

  // Step frame forward or backward (approx 1/30s = 0.033s)
  const stepFrame = (forward: boolean) => {
    const delta = forward ? 0.033 : -0.033;
    onSeek(Math.max(0, Math.min(safeDuration, currentTime + delta)));
  };

  // Fullscreen video
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-md">
      {/* Video Viewport */}
      <div className="relative aspect-video max-h-[460px] w-full bg-black flex items-center justify-center group overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          playsInline
        />

        {/* Floating Quick Play Overlay on Click */}
        <button
          onClick={onTogglePlay}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transform transition-transform group-hover:scale-105">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </div>
        </button>

        {/* Video Filename & Current Time Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-xs text-white border border-white/10 font-mono">
          <span className="truncate max-w-[200px] text-neutral-300">{videoName}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-blue-400 font-semibold">{formatSecondsToHHMMSSMS(currentTime)}</span>
        </div>

        {/* Clip Duration Pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 backdrop-blur-md text-xs text-blue-200 border border-blue-500/30 font-mono">
          <span>裁剪区间:</span>
          <span className="font-bold text-white">{formatSecondsToHHMMSS(clipDuration)}</span>
        </div>
      </div>

      {/* Timeline Controls & Dual Range Scrubber */}
      <div className="p-4 bg-neutral-900/95 border-t border-neutral-800 text-neutral-200 flex flex-col gap-3">
        {/* Scrubber Area */}
        <div className="flex flex-col gap-1.5 select-none">
          {/* Time markers header */}
          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span>00:00:00</span>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">起: {formatSecondsToHHMMSS(startSeconds)}</span>
              <span>-</span>
              <span className="text-amber-400">止: {formatSecondsToHHMMSS(endSeconds)}</span>
            </div>
            <span>{formatSecondsToHHMMSS(safeDuration)}</span>
          </div>

          {/* Interactive Dual-Handle Track */}
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative h-10 bg-neutral-800 rounded-lg cursor-pointer overflow-visible border border-neutral-700/80"
          >
            {/* Filmstrip hash tick marks simulation */}
            <div className="absolute inset-0 flex justify-between px-1 items-center opacity-30 pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-2 w-0.5 bg-neutral-400 rounded-full" />
              ))}
            </div>

            {/* Selected Range Highlight Zone */}
            <div
              className="absolute top-0 bottom-0 bg-blue-500/30 border-y border-blue-400/50 backdrop-blur-xs"
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(0, endPercent - startPercent)}%`,
              }}
            />

            {/* Start Time Handle */}
            <div
              onPointerDown={(e) => handlePointerDown('start', e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute top-0 bottom-0 w-3.5 -ml-1.5 bg-blue-500 hover:bg-blue-400 cursor-ew-resize z-20 flex items-center justify-center rounded-l-md shadow-md border border-blue-300"
              style={{ left: `${startPercent}%` }}
              title={`裁剪起点: ${formatSecondsToHHMMSS(startSeconds)}`}
            >
              <div className="w-0.5 h-4 bg-white/80 rounded-full" />
            </div>

            {/* End Time Handle */}
            <div
              onPointerDown={(e) => handlePointerDown('end', e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute top-0 bottom-0 w-3.5 -ml-2 bg-amber-500 hover:bg-amber-400 cursor-ew-resize z-20 flex items-center justify-center rounded-r-md shadow-md border border-amber-300"
              style={{ left: `${endPercent}%` }}
              title={`裁剪终点: ${formatSecondsToHHMMSS(endSeconds)}`}
            >
              <div className="w-0.5 h-4 bg-white/80 rounded-full" />
            </div>

            {/* Playhead Marker */}
            <div
              onPointerDown={(e) => handlePointerDown('playhead', e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute top-0 bottom-0 w-1 -ml-0.5 bg-white shadow-lg z-30 cursor-ew-resize pointer-events-auto"
              style={{ left: `${currentPercent}%` }}
              title={`当前播放: ${formatSecondsToHHMMSSMS(currentTime)}`}
            >
              <div className="w-3 h-3 bg-white border border-neutral-900 rounded-full -ml-1 -top-1 absolute shadow-sm" />
            </div>
          </div>
        </div>

        {/* Player Transport Bar */}
        <div className="flex items-center justify-between pt-1">
          {/* Left Transport controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSeek(startSeconds)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title="跳转到裁剪起点"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => stepFrame(false)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title="上一帧 (1/30 秒)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              <span>{isPlaying ? '暂停' : '播放'}</span>
            </button>

            <button
              onClick={() => stepFrame(true)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title="下一帧 (1/30 秒)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleLoop}
              className={`p-1.5 rounded-md transition-colors ${
                isLoopingClip
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isLoopingClip ? '循环播放片段 (已开启)' : '循环播放片段 (已关闭)'}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Right Volume & Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title={isMuted ? '解除静音' : '静音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title="全屏预览"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
