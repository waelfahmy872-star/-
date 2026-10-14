import React from 'react';
import { HelpCircle, CheckCircle2, Mic, Clock, Download, Sparkles, Sliders, Film } from 'lucide-react';

interface DocumentationProps {
  lang: 'ar' | 'en';
}

export const Documentation: React.FC<DocumentationProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Hero */}
      <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/40 rounded-2xl border border-indigo-800/40 p-6 shadow-xl text-center space-y-3">
        <h2 className="text-2xl font-black text-white">
          {isAr ? 'دليل استخدام منظومة ياسين كابشن (Yaseen Caption)' : 'Yaseen Caption User Manual'}
        </h2>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'تطبيق ذكي متكامل مصمم لصناع المحتوى، المحررين، ومنتجي البودكاست لتحويل الصوت إلى ملفات ترجمة نصية متزامنة بدقة 100% مع إنشاء الأغلفة بالذكاء الاصطناعي.'
            : 'An all-in-one suite for content creators, video editors, and podcasters to transcribe audio into 100% synchronized SRT subtitles.'}
        </p>
      </div>

      {/* 5 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
            <Mic className="w-5 h-5" />
            <span>{isAr ? '1. رفع الصوت أو التسجيل المباشر' : '1. Audio Upload & Recording'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? 'يمكنك سحب وإفلات أي ملف صوتي بصيغ MP3, WAV, M4A, OGG, FLAC، أو تسجيل صوتك مباشرة عبر الميكروفون المدمج، أو تجربة العينات الجاهزة.'
              : 'Upload any audio format or record your voice live using the built-in microphone recorder with visual waveform feedback.'}
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
            <Sliders className="w-5 h-5" />
            <span>{isAr ? '2. اختيار اللهجة وعدد الكلمات' : '2. Dialect & Words Per Line'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? 'حدّد اللهجة بدقة (فصحى، مصرية، شامية، خليجية، مغاربية، إنجليزية) لضمان تفريغ العبارات المحلية والتشكيل الصحيح. اختر 3 أو 5 أو 7 أو 10 كلمات لكل سطر.'
              : 'Select your target dialect and words per line to fit TikTok/Reels captions (3 words) or YouTube documentary style (7-10 words).'}
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <Clock className="w-5 h-5" />
            <span>{isAr ? '3. المزامنة الدقيقة بالمللي ثانية (100% Sync)' : '3. Millisecond Precision Sync'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? 'يتم استخراج البصمة الزمنية لكل مقطع وكلمة لضمان تطابق تام بين الصوت والكلمات المكتوبة دون أي تأخر أو تقدم في العرض.'
              : 'Every word timestamp is analyzed down to the millisecond, eliminating caption drift or synchronization lag.'}
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center gap-2 text-pink-400 font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <span>{isAr ? '4. منشئ الصور والأغلفة الذكي' : '4. AI Image & Thumbnail Generator'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? 'أنشئ أغلفة بودكاست وصور مصغرة لفيديوهاتك بجميع الأبعاد (1:1, 16:9, 9:16) بأساليب سينمائية، ثلاثية الأبعاد، أو خط عربي مذهب.'
              : 'Generate custom cover art and thumbnails with 1-click aspect ratio presets for YouTube, Instagram, and TikTok.'}
          </p>
        </div>
      </div>

      {/* Editing Software Compatibility */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'توافق ملفات SRT المصدرة مع برامج المونتاج:' : 'NLE Software Compatibility:'}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-300">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Adobe Premiere Pro</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>CapCut (PC & Mobile)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>DaVinci Resolve</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Final Cut Pro & VLC</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 pt-1">
          {isAr
            ? 'يتم تشفير الملفات بترميز UTF-8 مع BOM لضمان عدم ظهور الحروف العربية مشوهة أو معكوسة داخل أي محرر فيديو.'
            : 'Files are exported in UTF-8 with BOM signature, preventing reversed or corrupted Arabic text in video editors.'}
        </p>
      </div>
    </div>
  );
};
