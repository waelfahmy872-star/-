import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Music, Mic, Square, Sparkles, RefreshCw, CheckCircle2, FileAudio } from 'lucide-react';
import { SAMPLE_AUDIOS, SampleAudio, createSynthesizedAudio } from '../utils/sampleAudios';

interface AudioUploaderProps {
  onAudioSelected: (file: File | Blob, dataUrl: string, fileName: string, sampleData?: SampleAudio) => void;
  selectedFileName: string | null;
  audioDuration: number;
  isProcessing: boolean;
  lang: 'ar' | 'en';
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAudioSelected,
  selectedFileName,
  audioDuration,
  isProcessing,
  lang,
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onAudioSelected(file, dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const fileName = `تسجيل_صوتي_${new Date().toLocaleTimeString('ar-EG')}.webm`;
          onAudioSelected(audioBlob, dataUrl, fileName);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert(isAr ? 'تعذر الوصول إلى الميكروفون. يرجى التحقق من أذونات المتصفح.' : 'Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Handle sample selection
  const handleSelectSample = (sample: SampleAudio) => {
    const audioBlob = createSynthesizedAudio(sample.duration);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onAudioSelected(audioBlob, dataUrl, `${sample.title}.wav`, sample);
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <FileAudio className="w-5 h-5" />
          <h2 className="text-base sm:text-lg text-slate-100">
            {isAr ? '1. رفع الملف الصوتي أو التسجيل' : '1. Audio Upload or Recording'}
          </h2>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
          MP3, WAV, M4A, OGG
        </span>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : selectedFileName
            ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500'
            : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac,.webm"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          {selectedFileName ? (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-2 ring-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
          )}

          <div>
            {selectedFileName ? (
              <>
                <p className="text-slate-100 font-bold text-base truncate max-w-xs sm:max-w-md mx-auto">
                  {selectedFileName}
                </p>
                <p className="text-emerald-400 text-xs font-semibold mt-1">
                  {isAr ? '✓ تم تجهيز الملف الصوتي بنجاح' : '✓ Audio file ready for analysis'}
                  {audioDuration > 0 && ` (${audioDuration.toFixed(1)} ${isAr ? 'ثانية' : 'sec'})`}
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-200 font-bold text-sm sm:text-base">
                  {isAr ? 'اضغط لاختيار ملف صوتي أو اسحبه هنا' : 'Click to upload audio or drag and drop'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {isAr
                    ? 'يدعم جميع الصيغ: MP3, WAV, M4A, OGG, FLAC, WEBM'
                    : 'Supports all standard formats: MP3, WAV, M4A, OGG, FLAC'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alternative Input Options: Live Recording & Sample Audio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Record Audio Button */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                {isRecording ? (isAr ? 'جاري التسجيل...' : 'Recording...') : (isAr ? 'تسجيل مباشر' : 'Record Mic')}
              </p>
              {isRecording && (
                <span className="text-[11px] font-mono text-red-400 font-semibold">{formatTimer(recordingSeconds)}</span>
              )}
            </div>
          </div>

          {isRecording ? (
            <button
              onClick={stopRecording}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{isAr ? 'إيقاف' : 'Stop'}</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold transition-all"
            >
              <span>{isAr ? 'ابدأ التسجيل' : 'Record'}</span>
            </button>
          )}
        </div>

        {/* Preset Sample Selector for Instant Testing */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isAr ? 'تجربة عينة جاهزة بضغطة زر:' : 'Try Sample Audio:'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {SAMPLE_AUDIOS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                disabled={isProcessing}
                className="flex-1 py-1 px-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/80 text-[11px] font-semibold text-slate-300 hover:text-white transition-all truncate border border-slate-700/60"
                title={sample.description}
              >
                {sample.id === 'arabic-msa' ? 'فصحى' : sample.id === 'arabic-egyptian' ? 'مصري' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
