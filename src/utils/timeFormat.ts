/**
 * Time formatting and parsing utilities for macOS Video Trimmer (TrimCraft 1.0)
 * Requirements:
 * - Format: HH:MM:SS (e.g., 01:25:36)
 * - Auto-complete: When user enters "012536", automatically format to "01:25:36"
 * - Defaults: Start time = 0 ("00:00:00"), End time = video total duration
 */

/**
 * Formats seconds into HH:MM:SS string
 */
export function formatSecondsToHHMMSS(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00';
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats seconds into HH:MM:SS.ms string for detailed display
 */
export function formatSecondsToHHMMSSMS(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00.000';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (num: number, len = 2) => num.toString().padStart(len, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

/**
 * Parses HH:MM:SS string into seconds
 */
export function parseHHMMSSToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;

  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else if (parts.length === 1) {
    return parseFloat(parts[0]) || 0;
  }
  return 0;
}

/**
 * Smart Auto-Completer for time input:
 * Specifically fulfills: "用户输入 012536 后，自动补全为 01:25:36 并显示在操作界面"
 * Also handles:
 * - Raw digit strings (e.g. "012536" -> "01:25:36")
 * - 4 digits (e.g. "2536" -> "00:25:36")
 * - 2 digits (e.g. "45" -> "00:00:45")
 * - Coloned strings with partial digits (e.g. "1:25:36" -> "01:25:36")
 * - Normalizes minutes and seconds to <= 59 where appropriate
 */
export function autocompleteTimeInput(input: string, maxSeconds?: number): {
  formatted: string;
  seconds: number;
  isValid: boolean;
} {
  if (!input || input.trim() === '') {
    return { formatted: '00:00:00', seconds: 0, isValid: true };
  }

  const clean = input.trim();

  // If already standard HH:MM:SS
  const fullRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  const matchFull = clean.match(fullRegex);
  if (matchFull) {
    const h = parseInt(matchFull[1], 10);
    const m = Math.min(59, parseInt(matchFull[2], 10));
    const s = Math.min(59, parseInt(matchFull[3], 10));
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${pad(h)}:${pad(m)}:${pad(s)}`;
    const secs = h * 3600 + m * 60 + s;
    const boundedSecs = maxSeconds !== undefined ? Math.min(secs, maxSeconds) : secs;
    return {
      formatted: maxSeconds !== undefined && secs > maxSeconds ? formatSecondsToHHMMSS(boundedSecs) : formatted,
      seconds: boundedSecs,
      isValid: true,
    };
  }

  // Extract all digits only
  const digits = clean.replace(/\D/g, '');

  if (digits.length === 0) {
    return { formatted: '00:00:00', seconds: 0, isValid: false };
  }

  let h = 0;
  let m = 0;
  let s = 0;

  if (digits.length >= 6) {
    // 6 or more digits: Take first 6 as HHMMSS (e.g. "012536" -> H=01, M=25, S=36)
    const hStr = digits.slice(0, 2);
    const mStr = digits.slice(2, 4);
    const sStr = digits.slice(4, 6);
    h = parseInt(hStr, 10);
    m = parseInt(mStr, 10);
    s = parseInt(sStr, 10);
  } else if (digits.length === 5) {
    // 5 digits: HMMSS (e.g. "12536" -> H=1, M=25, S=36)
    h = parseInt(digits.slice(0, 1), 10);
    m = parseInt(digits.slice(1, 3), 10);
    s = parseInt(digits.slice(3, 5), 10);
  } else if (digits.length === 4) {
    // 4 digits: MMSS (e.g. "2536" -> 00:25:36)
    m = parseInt(digits.slice(0, 2), 10);
    s = parseInt(digits.slice(2, 4), 10);
  } else if (digits.length === 3) {
    // 3 digits: MSS (e.g. "236" -> 00:02:36)
    m = parseInt(digits.slice(0, 1), 10);
    s = parseInt(digits.slice(1, 3), 10);
  } else if (digits.length <= 2) {
    // 1 or 2 digits: SS (e.g. "36" -> 00:00:36)
    s = parseInt(digits, 10);
  }

  // Normalize seconds > 59 or minutes > 59
  if (s >= 60) {
    m += Math.floor(s / 60);
    s = s % 60;
  }
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }

  let totalSecs = h * 3600 + m * 60 + s;
  if (maxSeconds !== undefined && totalSecs > maxSeconds) {
    totalSecs = maxSeconds;
    return {
      formatted: formatSecondsToHHMMSS(totalSecs),
      seconds: totalSecs,
      isValid: true,
    };
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(h)}:${pad(m)}:${pad(s)}`;

  return {
    formatted,
    seconds: totalSecs,
    isValid: true,
  };
}

/**
 * Live typing formatter: formats digits with colons on the fly
 */
export function formatLiveTyping(val: string): string {
  // Strip non-digits
  const digits = val.replace(/\D/g, '').slice(0, 6);
  if (!digits) return '';

  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}`;
  }
}
