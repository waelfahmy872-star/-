import React from 'react';
import { Mic, Sparkles, Image as ImageIcon, FileCode2, Volume2, ShieldCheck, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'subtitles' | 'images' | 'code' | 'docs';
  setActiveTab: (tab: 'subtitles' | 'images' | 'code' | 'docs') => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, lang, setLang }) => {
  const isAr = lang === 'ar';

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          
          {/* Main App Title & Branding */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/30">
                <Mic className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-l from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                  ياسين كابشن
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
                  Yaseen Caption
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {isAr
                  ? 'منظومة تفريغ الصوت الاحترافية وتوليد ملفات الترجمة SRT المتزامنة 100%'
                  : 'Professional Audio Speech-to-Text & 100% Synchronized SRT Subtitle Engine'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveTab('subtitles')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'subtitles'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isAr ? 'تفريغ و SRT' : 'Transcribe & SRT'}</span>
            </button>

            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'images'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isAr ? 'منشئ الصور الذكي' : 'AI Image Generator'}</span>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded-full border border-pink-500/30">AI</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'code'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>{isAr ? 'كود ستريمليت (Python)' : 'Streamlit Code'}</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'docs'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isAr ? 'الدليل' : 'Guide'}</span>
            </button>
          </div>

          {/* Language Switch & Quality Badge */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Sync Precision</span>
            </div>

            <button
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              title="Toggle language / تغيير لغة الواجهة"
            >
              {isAr ? 'English 🌐' : 'عربي 🌐'}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
