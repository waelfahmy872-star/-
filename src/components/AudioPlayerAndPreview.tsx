import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Edit3,
  Trash2,
  Plus,
  Search,
  Check,
  Sparkles,
  Maximize2,
  Clock,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { SubtitleSegment } from '../types';
import { formatToSrtTime, parseSrtTimeToSeconds } from '../utils/srtFormatter';

interface AudioPlayerAndPreviewProps {
  audioUrl: string | null;
  segments: SubtitleSegment[];
  onUpdateSegments: (segments: SubtitleSegment[]) => void;
  lang: 'ar' | 'en';
}

export const AudioPlayerAndPreview: React.FC<AudioPlayerAndPreviewProps> = ({
  audioUrl,
  segments,
  onUpdateSegments,
  lang,
}) => {
  const isAr = lang === 'ar';
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subtitleStyle, setSubtitleStyle] = useState<'tiktok' | 'cinema' | 'neon' | 'box'>('tiktok');
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioUrl]);

  // Find active segment based on current audio time
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  // Find active word inside active segment if word timestamps exist
  const activeWord = activeSegment?.words?.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const seekTo = (timeInSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(timeInSeconds, duration || 9999));
    setCurrentTime(audio.currentTime);
  };

  const skipSeconds = (delta: number) => {
    seekTo(currentTime + delta);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  // Editing segments
  const startEditing = (seg: SubtitleSegment) => {
    setEditingSegmentId(seg.id);
    setEditingText(seg.text);
  };

  const saveEditing = (id: number) => {
    onUpdateSegments(
      segments.map((seg) => (seg.id === id ? { ...seg, text: editingText } : seg))
    );
    setEditingSegmentId(null);
  };

  const deleteSegment = (id: number) => {
    const updated = segments
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, id: idx + 1 }));
    onUpdateSegments(updated);
  };

  const adjustTiming = (id: number, deltaStart: number, deltaEnd: number) => {
    onUpdateSegments(
      segments.map((seg) => {
        if (seg.id === id) {
          return {
            ...seg,
            start: Math.max(0, Number((seg.start + deltaStart).toFixed(2))),
            end: Math.max(0.1, Number((seg.end + deltaEnd).toFixed(2))),
          };
        }
        return seg;
      })
    );
  };

  const addNewSegmentAfter = (index: number) => {
    const current = segments[index];
    const newStart = current ? current.end + 0.1 : 0;
    const newEnd = newStart + 2.0;
    const newSeg: SubtitleSegment = {
      id: segments.length + 1,
      start: Number(newStart.toFixed(2)),
      end: Number(newEnd.toFixed(2)),
      text: isAr ? 'سطر ترجمة جديد' : 'New caption line',
    };

    const copy = [...segments];
    copy.splice(index + 1, 0, newSeg);
    const reindexed = copy.map((s, i) => ({ ...s, id: i + 1 }));
    onUpdateSegments(reindexed);
    startEditing(newSeg);
  };

  // Filtered segments for search
  const filteredSegments = segments.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Hidden native audio element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* Synchronized Live Subtitle Stage (Reels / Video Simulation) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>{isAr ? 'شاشة العرض والمزامنة الحية (Live Caption Stage)' : 'Live Caption Sync Stage'}</span>
          </div>

          {/* Subtitle Style Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setSubtitleStyle('tiktok')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                subtitleStyle === 'tiktok' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              TikTok Pop
            </button>
            <button
              onClick={() => setSubtitleStyle('cinema')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                subtitleStyle === 'cinema' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cinema
            </button>
            <button
              onClick={() => setSubtitleStyle('neon')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                subtitleStyle === 'neon' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Neon Glow
            </button>
            <button
              onClick={() => setSubtitleStyle('box')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                subtitleStyle === 'box' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Classic Box
            </button>
          </div>
        </div>

        {/* Video Canvas Simulation Area */}
        <div className="relative min-h-[220px] sm:min-h-[260px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          {/* Subtle audio visualizer waves background */}
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-15 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-indigo-500 rounded-full transition-all duration-150"
                style={{
                  height: isPlaying ? `${Math.sin(currentTime * 5 + i) * 40 + 50}%` : '20%',
                }}
              />
            ))}
          </div>

          {/* Subtitle Rendering with Dynamic Styles */}
          <div className="relative z-10 max-w-2xl px-4 py-3">
            {activeSegment ? (
              <div className="transition-all duration-200">
                {subtitleStyle === 'tiktok' && (
                  <div className="inline-block bg-slate-950/85 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                    <p className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                      {activeSegment.words && activeSegment.words.length > 0 ? (
                        activeSegment.words.map((w, idx) => {
                          const isWordActive = currentTime >= w.start && currentTime <= w.end;
                          return (
                            <span
                              key={idx}
                              className={`inline-block mx-1 transition-all ${
                                isWordActive
                                  ? 'text-amber-300 scale-110 drop-shadow-[0_2px_10px_rgba(251,191,36,0.8)] font-black'
                                  : 'text-slate-100 opacity-90'
                              }`}
                            >
                              {w.word}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-amber-300">{activeSegment.text}</span>
                      )}
                    </p>
                  </div>
                )}

                {subtitleStyle === 'cinema' && (
                  <div className="inline-block bg-black/75 px-6 py-2.5 rounded-xl border border-white/10 shadow-2xl">
                    <p className="text-xl sm:text-2xl font-bold text-yellow-300 tracking-wide font-sans leading-relaxed">
                      {activeSegment.text}
                    </p>
                  </div>
                )}

                {subtitleStyle === 'neon' && (
                  <div className="inline-block bg-slate-950/90 px-6 py-3 rounded-2xl border border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.4)]">
                    <p className="text-xl sm:text-2xl font-black text-pink-300 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">
                      {activeSegment.text}
                    </p>
                  </div>
                )}

                {subtitleStyle === 'box' && (
                  <div className="inline-block bg-slate-900/95 px-5 py-2.5 rounded-lg border border-slate-700">
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {activeSegment.text}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {formatToSrtTime(activeSegment.start)} ➔ {formatToSrtTime(activeSegment.end)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (#{activeSegment.id})
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm font-semibold flex flex-col items-center gap-2">
                <Clock className="w-6 h-6 text-slate-600 animate-pulse" />
                <p>
                  {segments.length > 0
                    ? isAr
                      ? 'اضغط زر التشغيل للمزامنة الحية، أو اضغط على أي سطر أدناه للقفز إليه'
                      : 'Press play to watch live synchronization, or click any segment below'
                    : isAr
                    ? 'لم يتم استخراج أسطر ترجمة بعد'
                    : 'No subtitles loaded yet'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.01}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold text-indigo-400">{formatToSrtTime(currentTime)}</span>
              <span>{formatToSrtTime(duration)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Rewind 5s */}
              <button
                onClick={() => skipSeconds(-5)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800"
                title={isAr ? 'تراجع 5 ثوانٍ' : 'Rewind 5s'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
              </button>

              {/* Forward 5s */}
              <button
                onClick={() => skipSeconds(5)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800"
                title={isAr ? 'تقدم 5 ثوانٍ' : 'Forward 5s'}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Speed selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    playbackRate === speed
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-all"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle Segments Interactive Editor List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{isAr ? 'قائمة مقاطع الترجمة المتزامنة' : 'Synchronized Caption Segments'}</span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded-full border border-indigo-500/20">
                {segments.length} {isAr ? 'مقطع' : 'segments'}
              </span>
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في الترجمة...' : 'Search in captions...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Segments Scroll Area */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
          {filteredSegments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              {isAr ? 'لا توجد نتائج مطابقة' : 'No matching segments found'}
            </div>
          ) : (
            filteredSegments.map((seg, idx) => {
              const isActive = currentTime >= seg.start && currentTime <= seg.end;
              const isEditing = editingSegmentId === seg.id;

              return (
                <div
                  key={seg.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  {/* Segment Details & Text */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Index & Jump button */}
                    <button
                      onClick={() => seekTo(seg.start)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white'
                      }`}
                      title={isAr ? 'انقر للقفز إلى التوقيت' : 'Click to seek'}
                    >
                      {seg.id}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Timestamps */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => seekTo(seg.start)}
                          className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{formatToSrtTime(seg.start)} ➔ {formatToSrtTime(seg.end)}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({(seg.end - seg.start).toFixed(2)}s)
                        </span>
                      </div>

                      {/* Text content or edit input */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditing(seg.id)}
                            autoFocus
                            className="w-full bg-slate-900 border border-indigo-500 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                          />
                          <button
                            onClick={() => saveEditing(seg.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                            title={isAr ? 'حفظ التعديل' : 'Save'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p
                          onClick={() => seekTo(seg.start)}
                          className={`text-sm sm:text-base font-semibold cursor-pointer transition-colors ${
                            isActive ? 'text-indigo-200 font-bold' : 'text-slate-200 hover:text-indigo-300'
                          }`}
                        >
                          {seg.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions (Timing nudge, edit, delete, add) */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Timing nudge (-0.1s / +0.1s) */}
                    <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                      <button
                        onClick={() => adjustTiming(seg.id, -0.1, -0.1)}
                        className="px-1.5 py-0.5 hover:bg-slate-800 hover:text-white rounded"
                        title={isAr ? 'تقديم التوقيت 0.1 ثانية' : '-0.1s'}
                      >
                        -0.1s
                      </button>
                      <button
                        onClick={() => adjustTiming(seg.id, 0.1, 0.1)}
                        className="px-1.5 py-0.5 hover:bg-slate-800 hover:text-white rounded"
                        title={isAr ? 'تأخير التوقيت 0.1 ثانية' : '+0.1s'}
                      >
                        +0.1s
                      </button>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => (isEditing ? saveEditing(seg.id) : startEditing(seg))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                      title={isAr ? 'تعديل النص' : 'Edit text'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Add Line After */}
                    <button
                      onClick={() => addNewSegmentAfter(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all"
                      title={isAr ? 'إضافة سطر تالٍ' : 'Add segment after'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteSegment(seg.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
                      title={isAr ? 'حذف هذا السطر' : 'Delete segment'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
