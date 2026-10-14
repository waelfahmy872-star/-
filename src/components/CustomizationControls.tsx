import React from 'react';
import { Sliders, Languages, Type, Play, Sparkles, Loader2, Gauge } from 'lucide-react';
import { DialectOption } from '../types';

interface CustomizationControlsProps {
  wordsPerLine: number;
  setWordsPerLine: (val: number) => void;
  dialect: DialectOption;
  setDialect: (val: DialectOption) => void;
  onStartTranscription: () => void;
  isProcessing: boolean;
  hasAudio: boolean;
  hasSegments: boolean;
  lang: 'ar' | 'en';
}

export const DIALECT_OPTIONS: { value: DialectOption; labelAr: string; labelEn: string; desc: string }[] = [
  {
    value: 'Modern Standard Arabic (الفصحى)',
    labelAr: 'العربية الفصحى (Modern Standard Arabic)',
    labelEn: 'Modern Standard Arabic',
    desc: 'مخارج فصيحة، كتب وصحافة وأخبار وبرامج وثائقية',
  },
  {
    value: 'Egyptian Arabic (العامية المصرية)',
    labelAr: 'العامية المصرية (Egyptian Arabic)',
    labelEn: 'Egyptian Colloquial Arabic',
    desc: 'اللهجة المصرية المعتادة في المحتوى، البودكاست، واليوتيوب',
  },
  {
    value: 'Levantine Arabic (اللهجة الشامية)',
    labelAr: 'اللهجة الشامية (Levantine Arabic)',
    labelEn: 'Levantine Arabic (Syria, Lebanon, Jordan, Palestine)',
    desc: 'سورية، لبنانية، فلسطينية، وأردنية',
  },
  {
    value: 'Gulf Arabic (اللهجة الخليجية)',
    labelAr: 'اللهجة الخليجية (Gulf Arabic)',
    labelEn: 'Gulf Arabic (Saudi, UAE, Kuwait, etc.)',
    desc: 'سعودية، إماراتية، كويتية، قطرية، وبحرينية',
  },
  {
    value: 'English (الإنجليزية)',
    labelAr: 'الإنجليزية (English)',
    labelEn: 'English (Global / American / British)',
    desc: 'النطق الإنجليزي العام والعالمي',
  },
  {
    value: 'Moroccan Arabic (الدارجة المغربية)',
    labelAr: 'الدارجة المغربية (Moroccan Darija)',
    labelEn: 'Moroccan Darija Arabic',
    desc: 'المصطلحات والتراكيب الدارجة في بلاد المغرب العربي',
  },
];

export const CustomizationControls: React.FC<CustomizationControlsProps> = ({
  wordsPerLine,
  setWordsPerLine,
  dialect,
  setDialect,
  onStartTranscription,
  isProcessing,
  hasAudio,
  hasSegments,
  lang,
}) => {
  const isAr = lang === 'ar';

  const wordsOptions = [3, 5, 7, 10, 12];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400 font-bold">
          <Sliders className="w-5 h-5" />
          <h2 className="text-base sm:text-lg text-slate-100">
            {isAr ? '2. إعدادات التزامن واللهجة' : '2. Synchronization & Dialect Controls'}
          </h2>
        </div>
        <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
          AI Precision Tuning
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language and Dialect Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-indigo-400" />
              {isAr ? 'اللغة واللهجة المستهدفة:' : 'Language & Dialect:'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isAr ? 'يدعم 6 لهجات' : '6 Dialects supported'}
            </span>
          </label>

          <div className="relative">
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as DialectOption)}
              disabled={isProcessing}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
            >
              {DIALECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
                  {isAr ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            {DIALECT_OPTIONS.find((d) => d.value === dialect)?.desc}
          </p>
        </div>

        {/* Words per line selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-purple-400" />
              {isAr ? 'عدد الكلمات لكل سطر ترجمة:' : 'Words Per Line Selector:'}
            </label>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              {wordsPerLine} {isAr ? 'كلمات' : 'words'}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {wordsOptions.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setWordsPerLine(num)}
                disabled={isProcessing}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  wordsPerLine === num
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                    : 'bg-slate-950/70 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>{isAr ? '3 كلمات: تيك توك وريلز سريع' : '3 words: TikTok / Reels'}</span>
            <span>{isAr ? '7-10 كلمات: يوتيوب وقراءة هادئة' : '7-10 words: YouTube standard'}</span>
          </div>
        </div>
      </div>

      {/* Main Process Trigger Button */}
      <div className="pt-2">
        <button
          onClick={onStartTranscription}
          disabled={!hasAudio || isProcessing}
          className={`w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg ${
            !hasAudio
              ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : isProcessing
              ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white cursor-wait animate-pulse'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.005] active:scale-[0.995]'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isAr ? 'جاري الاستماع وتوليد التزامن الدقيق (100% Sync)...' : 'Analyzing Audio & Synchronizing Timestamps (100% Sync)...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>
                {hasSegments
                  ? isAr
                    ? 'إعادة التحليل والمزامنة الفورية'
                    : 'Re-Analyze & Sync'
                  : isAr
                  ? 'بدء المعالجة والتوليد المتزامن لملف SRT'
                  : 'Start 100% Synchronized SRT Generation'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
