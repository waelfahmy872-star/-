import { SubtitleSegment, WordTimestamp } from '../types';

/**
 * Format float seconds into SRT timestamp string: HH:MM:SS,mmm
 */
export function formatToSrtTime(seconds: number): string {
  const safeSeconds = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const totalSeconds = Math.floor(safeSeconds);
  const millis = Math.floor((safeSeconds - totalSeconds) * 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Format float seconds into VTT timestamp string: HH:MM:SS.mmm
 */
export function formatToVttTime(seconds: number): string {
  return formatToSrtTime(seconds).replace(',', '.');
}

/**
 * Parse an SRT timestamp back to seconds (for manual user edits)
 */
export function parseSrtTimeToSeconds(srtTime: string): number {
  try {
    const parts = srtTime.trim().split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const secParts = parts[2].split(/[,\.]/);
      const seconds = parseInt(secParts[0], 10);
      const millis = parseInt(secParts[1] || '0', 10);
      return hours * 3600 + minutes * 60 + seconds + millis / 1000;
    }
  } catch (e) {
    console.error('Error parsing SRT time:', e);
  }
  return 0;
}

/**
 * Generate standard SRT file content
 */
export function generateSrtContent(segments: SubtitleSegment[]): string {
  const lines: string[] = [];

  segments.forEach((seg, idx) => {
    lines.push(String(idx + 1));
    lines.push(`${formatToSrtTime(seg.start)} --> ${formatToSrtTime(seg.end)}`);
    lines.push(seg.text.trim());
    lines.push(''); // Empty line separator
  });

  return lines.join('\n');
}

/**
 * Generate standard WebVTT file content
 */
export function generateVttContent(segments: SubtitleSegment[]): string {
  const lines: string[] = ['WEBVTT', ''];

  segments.forEach((seg, idx) => {
    lines.push(String(idx + 1));
    lines.push(`${formatToVttTime(seg.start)} --> ${formatToVttTime(seg.end)}`);
    lines.push(seg.text.trim());
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Download a string as a file with UTF-8 BOM so Arabic letters render cleanly in all editors
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  // UTF-8 BOM: \uFEFF ensures Windows, DaVinci Resolve, Premiere & VLC render Arabic text correctly
  const blob = new Blob(['\uFEFF', content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Dynamically re-chunk subtitle segments to fit a new wordsPerLine constraint
 * while strictly preserving start and end timestamps.
 */
export function rechunkSegments(segments: SubtitleSegment[], targetWordsPerLine: number): SubtitleSegment[] {
  if (!segments || segments.length === 0 || targetWordsPerLine <= 0) {
    return segments;
  }

  // Flatten all words with their fine-grained or interpolated timestamps
  const allWords: WordTimestamp[] = [];

  for (const seg of segments) {
    if (seg.words && seg.words.length > 0) {
      for (const w of seg.words) {
        if (w.word && w.word.trim()) {
          allWords.push({
            word: w.word.trim(),
            start: Math.max(seg.start, Number(w.start) || seg.start),
            end: Math.min(seg.end, Number(w.end) || seg.end),
          });
        }
      }
    } else {
      // Interpolate words from segment text
      const rawWords = seg.text.trim().split(/\s+/).filter(Boolean);
      if (rawWords.length === 0) continue;

      const segDur = Math.max(0.1, seg.end - seg.start);
      const step = segDur / rawWords.length;

      rawWords.forEach((word, i) => {
        allWords.push({
          word,
          start: Number((seg.start + i * step).toFixed(3)),
          end: Number((seg.start + (i + 1) * step).toFixed(3)),
        });
      });
    }
  }

  if (allWords.length === 0) {
    return segments;
  }

  // Chunk words into target groups
  const newSegments: SubtitleSegment[] = [];

  for (let i = 0; i < allWords.length; i += targetWordsPerLine) {
    const chunk = allWords.slice(i, i + targetWordsPerLine);
    const chunkText = chunk.map((w) => w.word).join(' ');
    const chunkStart = chunk[0].start;
    const chunkEnd = chunk[chunk.length - 1].end;

    newSegments.push({
      id: newSegments.length + 1,
      start: Number(chunkStart.toFixed(3)),
      end: Number(chunkEnd.toFixed(3)),
      text: chunkText,
      words: chunk,
    });
  }

  return newSegments;
}
