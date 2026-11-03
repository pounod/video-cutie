import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, Play, RefreshCw, Sparkles, AlertCircle, FileCode } from 'lucide-react';
import { TrimConfig, buildFFmpegCommand, buildAccurateFFmpegCommand, generateMacOSShellScript, generateAppleScriptRun } from '../utils/ffmpegHelper';
import { downloadFile } from '../utils/dmgGenerator';

interface TerminalPanelProps {
  config: TrimConfig;
  onRunBrowserExport?: () => void;
  isExporting?: boolean;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  config,
  onRunBrowserExport,
  isExporting = false,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [seekMode, setSeekMode] = useState<'fast' | 'accurate'>('fast');
  const [simulatedOutput, setSimulatedOutput] = useState<string[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const command = seekMode === 'fast'
    ? buildFFmpegCommand(config)
    : buildAccurateFFmpegCommand(config);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadScript = () => {
    const script = generateMacOSShellScript(config);
    downloadFile('trim_lossless.sh', script, 'text/x-sh');
  };

  // Simulate FFmpeg output on macOS
  const handleSimulateRun = () => {
    setIsSimulating(true);
    setSimulatedOutput([
      `[TrimCraft 1.0] 正在执行无损裁剪任务...`,
      `ffmpeg -ss ${config.startTime} -to ${config.endTime} -i "${config.inputFileName}" -c:v copy -c:a copy -avoid_negative_ts make_zero "${config.outputFileName}"`,
      `ffmpeg version 7.1 Copyright (c) 2000-2024 the FFmpeg developers (macOS Darwin)`,
      `Input #0, mov,mp4,m4a,3gp, from '${config.inputFileName}':`,
      `  Metadata:`,
      `    major_brand     : isom`,
      `    encoder         : Apple QuickTime / Lavf`,
      `  Duration: 00:09:56.28, start: 0.000000, bitrate: 12450 kb/s`,
      `  Stream #0:0[0x1](und): Video: h264 (High) (avc1), yuv420p, 1920x1080, 29.97 fps`,
      `  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a), 48000 Hz, stereo, fltp, 320 kb/s`,
      `Output #0, mp4, to '${config.outputFileName}':`,
      `  Stream #0:0: Video: h264 (avc1) [STREAM COPY - NO RE-ENCODING]`,
      `  Stream #0:1: Audio: aac (mp4a) [STREAM COPY - NO RE-ENCODING]`,
      `Stream mapping:`,
      `  Stream #0:0 -> #0:0 (copy)`,
      `  Stream #0:1 -> #0:1 (copy)`,
      `Press [q] to stop, [?] for help`,
    ]);

    setTimeout(() => {
      setSimulatedOutput((prev) => [
        ...(prev || []),
        `frame= 1850 fps=0.0 q=-1.0 size= 42180kB time=00:01:02.00 bitrate=5572.2kbits/s speed= 480x`,
        `[mp4 @ 0x140808200] Starting second pass: automatic timestamp shifting...`,
        `video:41120kB audio:1040kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 0.04%`,
        `=============================================================`,
        `🎉 [成功] 裁剪完成！耗时: 0.32秒 (480倍速无损流复制)`,
        `📂 已保留原视频分辨率、色彩空间及所有音频轨道。`,
      ]);
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Card */}
      <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              macOS FFmpeg 原生终端无损命令
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
            -c:v copy -c:a copy
          </span>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300">
          因为 macOS 系统已安装 FFmpeg，直接在终端执行流复制命令即可实现
          <span className="font-semibold text-neutral-900 dark:text-white"> 零损耗、秒级极速导出</span>。
          不会对原始画面和音频做任何二次压缩。
        </p>

        {/* Command Box */}
        <div className="relative group">
          <div className="p-3.5 bg-neutral-950 text-neutral-100 rounded-lg font-mono text-xs overflow-x-auto border border-neutral-800 leading-relaxed">
            <span className="text-emerald-400 font-bold">$ </span>
            <span className="text-neutral-200">{command}</span>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleCopy(command, 'command')}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded shadow-sm border border-neutral-700 transition-colors"
            >
              {copiedType === 'command' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>复制命令</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => handleCopy(command, 'command')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>复制终端指令</span>
          </button>

          <button
            onClick={handleDownloadScript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>下载 macOS 脚本 (.sh)</span>
          </button>

          <button
            onClick={() => handleCopy(generateAppleScriptRun(config), 'applescript')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-medium shadow-xs transition-colors"
            title="一键通过 AppleScript 唤起 macOS Terminal 自动执行"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-500" />
            <span>{copiedType === 'applescript' ? '已复制 AppleScript' : '复制终端自动唤醒指令'}</span>
          </button>

          <button
            onClick={handleSimulateRun}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium transition-colors"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>模拟在 macOS 运行测试</span>
          </button>
        </div>
      </div>

      {/* Simulated Terminal Window */}
      {simulatedOutput && (
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900/90 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="text-[11px] font-mono text-neutral-400 ml-2">Terminal — ffmpeg 7.1 (Darwin arm64)</span>
            </div>
            <button
              onClick={() => setSimulatedOutput(null)}
              className="text-[11px] text-neutral-500 hover:text-neutral-300"
            >
              清除
            </button>
          </div>

          <div className="p-4 font-mono text-xs text-neutral-300 space-y-1 max-h-64 overflow-y-auto">
            {simulatedOutput.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes('[成功]')
                    ? 'text-emerald-400 font-bold'
                    : line.includes('STREAM COPY')
                    ? 'text-blue-400 font-semibold'
                    : line.startsWith('$')
                    ? 'text-yellow-300 font-bold'
                    : 'text-neutral-400'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parameters Explained */}
      <div className="p-4 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>参数解析：为什么复制流保留原视频参数？</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 flex flex-col gap-1">
            <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">-c:v copy</code>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">视频流复制</span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              直接提取封装层内的原始 H.264/HEVC/ProRes 码流写入新容器，零像素重编码，不改变分辨率、色彩空间及码率。
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 flex flex-col gap-1">
            <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">-c:a copy</code>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">音频流复制</span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              保持原声 AAC、Dolby 等多音轨完整性，不改变采样率 (48kHz/44.1kHz) 和声道配置。
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 flex flex-col gap-1">
            <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">-avoid_negative_ts make_zero</code>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">时间戳对齐</span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              将输出视频的首帧时间戳自动移归为 0.000 秒，避免剪辑后播放器出现前几秒黑屏或音画不同步。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
