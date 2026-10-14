import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Code2, Sparkles, RefreshCw } from 'lucide-react';
import { SubtitleSegment } from '../types';
import {
  generateSrtContent,
  generateVttContent,
  downloadFile,
  rechunkSegments,
} from '../utils/srtFormatter';

interface SrtExportActionsProps {
  segments: SubtitleSegment[];
  onUpdateSegments: (segments: SubtitleSegment[]) => void;
  wordsPerLine: number;
  setWordsPerLine: (val: number) => void;
  lang: 'ar' | 'en';
}

export const SrtExportActions: React.FC<SrtExportActionsProps> = ({
  segments,
  onUpdateSegments,
  wordsPerLine,
  setWordsPerLine,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const [showRawSrt, setShowRawSrt] = useState(false);

  const srtContent = generateSrtContent(segments);
  const vttContent = generateVttContent(segments);

  const handleDownloadSrt = () => {
    downloadFile(srtContent, 'yaseen_caption.srt', 'application/x-subrip;charset=utf-8');
  };

  const handleDownloadVtt = () => {
    downloadFile(vttContent, 'yaseen_caption.vtt', 'text/vtt;charset=utf-8');
  };

  const handleDownloadTxt = () => {
    const textOnly = segments.map((s) => s.text).join('\n');
    downloadFile(textOnly, 'yaseen_transcript.txt', 'text/plain;charset=utf-8');
  };

  const handleCopySrt = () => {
    navigator.clipboard.writeText(srtContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Instant re-chunk handler
  const handleRechunk = (newWpl: number) => {
    setWordsPerLine(newWpl);
    const rechunked = rechunkSegments(segments, newWpl);
    onUpdateSegments(rechunked);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <span>{isAr ? 'تصدير وتنزيل ملف الترجمة (SRT)' : 'Export & Download SRT File'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr
              ? 'متوافق مع برامج المونتاج: Premiere Pro, Final Cut, DaVinci Resolve, CapCut, VLC'
              : 'Compatible with all NLEs: Premiere, CapCut, Final Cut, DaVinci, VLC'}
          </p>
        </div>

        {/* Live words-per-line instant adjuster */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-300 pr-1">
            {isAr ? 'إعادة تقسيم لحظية:' : 'Live Re-split:'}
          </span>
          {[3, 5, 7, 10].map((count) => (
            <button
              key={count}
              onClick={() => handleRechunk(count)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                wordsPerLine === count
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {count} {isAr ? 'كلمات' : 'w'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Direct Download SRT Button (Main Required Control) */}
        <button
          onClick={handleDownloadSrt}
          disabled={segments.length === 0}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>{isAr ? 'تنزيل ملف SRT مباشرة' : 'Download SRT File'}</span>
        </button>

        {/* Download VTT */}
        <button
          onClick={handleDownloadVtt}
          disabled={segments.length === 0}
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>{isAr ? 'تنزيل بتنسيق VTT' : 'Download WebVTT'}</span>
        </button>

        {/* Copy to Clipboard */}
        <button
          onClick={handleCopySrt}
          disabled={segments.length === 0}
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">{isAr ? 'تم النسخ بنجاح!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'نسخ نص SRT' : 'Copy SRT'}</span>
            </>
          )}
        </button>

        {/* Download Plain Text */}
        <button
          onClick={handleDownloadTxt}
          disabled={segments.length === 0}
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'تنزيل نصي (TXT)' : 'Download Plain TXT'}</span>
        </button>
      </div>

      {/* Raw SRT View Accordion */}
      <div className="pt-1">
        <button
          onClick={() => setShowRawSrt(!showRawSrt)}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          <span>
            {showRawSrt
              ? isAr
                ? 'إخفاء كود SRT الخام'
                : 'Hide Raw SRT code'
              : isAr
              ? 'عرض وفحص كود SRT الكامل'
              : 'View & Inspect Raw SRT code'}
          </span>
        </button>

        {showRawSrt && (
          <div className="mt-3 relative">
            <textarea
              readOnly
              value={srtContent}
              dir="ltr"
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
