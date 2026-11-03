/**
 * FFmpeg helper for macOS lossless video and audio stream copy (-c copy)
 */

export interface TrimConfig {
  inputFileName: string;
  outputFileName: string;
  startTime: string; // HH:MM:SS
  endTime: string;   // HH:MM:SS
  startSeconds: number;
  endSeconds: number;
}

/**
 * Builds the exact macOS Terminal command for lossless stream copy.
 * -ss before -i provides ultra-fast seek.
 * -c:v copy -c:a copy copies the elementary video and audio streams directly.
 * -avoid_negative_ts make_zero shifts timestamps to start at 0 without audio drift.
 */
export function buildFFmpegCommand(config: TrimConfig): string {
  const { inputFileName, outputFileName, startTime, endTime } = config;
  return `ffmpeg -ss ${startTime} -to ${endTime} -i "${inputFileName}" -c:v copy -c:a copy -avoid_negative_ts make_zero "${outputFileName}"`;
}

/**
 * Alternative frame-accurate seek command (if keyframe boundary needs tight precision)
 */
export function buildAccurateFFmpegCommand(config: TrimConfig): string {
  const { inputFileName, outputFileName, startTime, endTime } = config;
  return `ffmpeg -i "${inputFileName}" -ss ${startTime} -to ${endTime} -c:v copy -c:a copy -avoid_negative_ts make_zero "${outputFileName}"`;
}

/**
 * Generates an executable macOS Shell Script (.sh)
 * Supports both Apple Silicon (Homebrew at /opt/homebrew/bin) and Intel (/usr/local/bin)
 */
export function generateMacOSShellScript(config: TrimConfig): string {
  const { inputFileName, outputFileName, startTime, endTime } = config;

  return `#!/usr/bin/env bash
# ========================================================
# TrimCraft 1.0 - macOS 视频无损极速裁剪脚本
# 架构兼容: Apple Silicon (M1/M2/M3/M4) & Intel (x86_64)
# 特性: 视频流复制(-c:v copy) + 音频流复制(-c:a copy) 零画质损耗
# ========================================================

set -euo pipefail

echo "=========================================="
echo "🎬 TrimCraft 1.0 macOS 视频无损裁剪"
echo "=========================================="

# 1. 查找系统 FFmpeg 路径
FFMPEG_BIN=""
if command -v ffmpeg >/dev/null 2>&1; then
    FFMPEG_BIN="ffmpeg"
elif [ -x "/opt/homebrew/bin/ffmpeg" ]; then
    FFMPEG_BIN="/opt/homebrew/bin/ffmpeg"
elif [ -x "/usr/local/bin/ffmpeg" ]; then
    FFMPEG_BIN="/usr/local/bin/ffmpeg"
elif [ -x "/opt/local/bin/ffmpeg" ]; then
    FFMPEG_BIN="/opt/local/bin/ffmpeg"
else
    echo "❌ 错误: 未检测到已安装的 FFmpeg！"
    echo "💡 提示: 请在终端中运行以下命令安装 FFmpeg:"
    echo "    brew install ffmpeg"
    exit 1
fi

echo "✅ 找到 FFmpeg: $("$FFMPEG_BIN" -version | head -n 1)"
echo "📹 输入文件: ${inputFileName}"
echo "⏱  开始时间: ${startTime}"
echo "⏱  结束时间: ${endTime}"
echo "💾 输出文件: ${outputFileName}"
echo "------------------------------------------"
echo "⚡️ 正在以无损音视频流复制模式(-c copy)极速裁剪..."

"$FFMPEG_BIN" \\
  -ss "${startTime}" \\
  -to "${endTime}" \\
  -i "${inputFileName}" \\
  -c:v copy \\
  -c:a copy \\
  -avoid_negative_ts make_zero \\
  -y \\
  "${outputFileName}"

echo "------------------------------------------"
echo "🎉 裁剪完成！已保留原视频分辨率、码率、色彩格式与所有音频流。"
echo "📂 输出路径: $(pwd)/${outputFileName}"

# macOS 原生高亮显示文件
if [ "$(uname)" = "Darwin" ]; then
    open -R "${outputFileName}" 2>/dev/null || true
fi
`;
}

/**
 * Generates an AppleScript command that tells Terminal to execute the trim command
 */
export function generateAppleScriptRun(config: TrimConfig): string {
  const cmd = buildFFmpegCommand(config);
  return `osascript -e 'tell application "Terminal" to do script "${cmd}"'`;
}

/**
 * Generates a macOS Automator QuickAction script (for Finder context menu: Right Click -> Quick Actions)
 */
export function generateFinderQuickActionScript(): string {
  return `for f in "$@"
do
    filename="\${f%.*}"
    extension="\${f##*.}"
    output="\${filename}_trimmed.\${extension}"
    
    # 查找 FFmpeg
    FFMPEG="/opt/homebrew/bin/ffmpeg"
    [ ! -x "$FFMPEG" ] && FFMPEG="/usr/local/bin/ffmpeg"
    [ ! -x "$FFMPEG" ] && FFMPEG="ffmpeg"
    
    # 执行无损复制
    "$FFMPEG" -ss 00:00:00 -i "$f" -c:v copy -c:a copy -avoid_negative_ts make_zero -y "$output"
    osascript -e "display notification \\"无损裁剪完成: $output\\" with title \\"TrimCraft 1.0\\""
done`;
}
