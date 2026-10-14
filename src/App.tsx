import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioUploader } from './components/AudioUploader';
import { CustomizationControls } from './components/CustomizationControls';
import { AudioPlayerAndPreview } from './components/AudioPlayerAndPreview';
import { SrtExportActions } from './components/SrtExportActions';
import { ImageGenerator } from './components/ImageGenerator';
import { StreamlitCodeViewer } from './components/StreamlitCodeViewer';
import { Documentation } from './components/Documentation';
import { DialectOption, SubtitleSegment } from './types';
import { SampleAudio } from './utils/sampleAudios';
import { rechunkSegments } from './utils/srtFormatter';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'subtitles' | 'images' | 'code' | 'docs'>('subtitles');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Audio State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Customization Controls State
  const [wordsPerLine, setWordsPerLine] = useState<number>(5);
  const [dialect, setDialect] = useState<DialectOption>('Modern Standard Arabic (الفصحى)');

  // Processing & Subtitles State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Set document direction and language on lang change
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Handle Audio File / Sample Selection
  const handleAudioSelected = (
    blob: Blob,
    dataUrl: string,
    fileName: string,
    sampleData?: SampleAudio
  ) => {
    setAudioBlob(blob);
    setAudioDataUrl(dataUrl);
    setSelectedFileName(fileName);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Read audio duration from audio element
    const tempAudio = new Audio(dataUrl);
    tempAudio.onloadedmetadata = () => {
      setAudioDuration(tempAudio.duration || 0);
    };

    if (sampleData) {
      // Auto-configure dialect and pre-load sample segments for instant try-out!
      setDialect(sampleData.dialect as DialectOption);
      const rechunked = rechunkSegments(sampleData.demoSegments, wordsPerLine);
      setSegments(rechunked);
      setAudioDuration(sampleData.duration);
      setSuccessMsg(
        lang === 'ar'
          ? `تم تحميل عينة "${sampleData.title}" بنجاح! يمكنك الآن الاستماع وتجربة التزامن الحي.`
          : `Loaded sample "${sampleData.title}"! You can test live synchronization now.`
      );
    } else {
      setSegments([]);
    }
  };

  // Trigger Gemini Audio Transcription with strict synchronization
  const handleStartTranscription = async () => {
    if (!audioDataUrl) {
      setErrorMsg(lang === 'ar' ? 'يرجى رفع ملف صوتي أولاً!' : 'Please select an audio file first!');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Determine MIME type
      let mimeType = 'audio/mp3';
      if (audioBlob?.type) {
        mimeType = audioBlob.type;
      } else if (selectedFileName?.endsWith('.wav')) {
        mimeType = 'audio/wav';
      } else if (selectedFileName?.endsWith('.m4a')) {
        mimeType = 'audio/m4a';
      } else if (selectedFileName?.endsWith('.ogg')) {
        mimeType = 'audio/ogg';
      } else if (selectedFileName?.endsWith('.webm')) {
        mimeType = 'audio/webm';
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioDataUrl,
          mimeType,
          language: dialect,
          wordsPerLine,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      // Re-chunk strictly by the user's selected wordsPerLine
      const formattedSegments = rechunkSegments(data.segments, wordsPerLine);
      setSegments(formattedSegments);
      setSuccessMsg(
        lang === 'ar'
          ? 'تم التفريغ والمزامنة بنجاح بنسبة 100%! يمكنك الآن معاينة وتنزيل ملف SRT.'
          : 'Successfully transcribed and synchronized with 100% precision!'
      );
    } catch (err: any) {
      console.error('Transcription failed:', err);
      setErrorMsg(
        err.message ||
          (lang === 'ar'
            ? 'حدث خطأ أثناء معالجة الصوت. تأكد من صحة الملف وحاول مجدداً.'
            : 'Error occurred while processing audio.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header with Branding */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
      />

      {/* Notifications / Alerts Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* TAB 1: Subtitle Transcription & Synchronized Preview */}
        {activeTab === 'subtitles' && (
          <div className="space-y-6">
            {/* Top Row: Audio Uploader + Customization Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AudioUploader
                onAudioSelected={handleAudioSelected}
                selectedFileName={selectedFileName}
                audioDuration={audioDuration}
                isProcessing={isProcessing}
                lang={lang}
              />

              <CustomizationControls
                wordsPerLine={wordsPerLine}
                setWordsPerLine={setWordsPerLine}
                dialect={dialect}
                setDialect={setDialect}
                onStartTranscription={handleStartTranscription}
                isProcessing={isProcessing}
                hasAudio={Boolean(audioDataUrl)}
                hasSegments={segments.length > 0}
                lang={lang}
              />
            </div>

            {/* Middle Section: Player & Live Caption Preview */}
            <AudioPlayerAndPreview
              audioUrl={audioDataUrl}
              segments={segments}
              onUpdateSegments={setSegments}
              lang={lang}
            />

            {/* Bottom Row: SRT Export Actions & Download */}
            {segments.length > 0 && (
              <SrtExportActions
                segments={segments}
                onUpdateSegments={setSegments}
                wordsPerLine={wordsPerLine}
                setWordsPerLine={setWordsPerLine}
                lang={lang}
              />
            )}
          </div>
        )}

        {/* TAB 2: AI Image Generator */}
        {activeTab === 'images' && (
          <ImageGenerator segments={segments} lang={lang} />
        )}

        {/* TAB 3: Python Streamlit Single-file Script */}
        {activeTab === 'code' && (
          <StreamlitCodeViewer lang={lang} />
        )}

        {/* TAB 4: Documentation & Guide */}
        {activeTab === 'docs' && (
          <Documentation lang={lang} />
        )}
      </main>

      {/* App Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">ياسين كابشن | Yaseen Caption</span>
            <span>•</span>
            <span>{lang === 'ar' ? 'توليد ترجمة متزامنة 100%' : '100% Synchronized SRT Engine'}</span>
          </div>
          <div>
            <span>{lang === 'ar' ? 'مدعوم بنماذج Gemini 3 و AI Image Engine' : 'Powered by Gemini 3 STT & AI Image Generation'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
