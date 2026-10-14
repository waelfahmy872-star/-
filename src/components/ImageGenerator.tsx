import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Palette,
  Ratio,
  Lightbulb,
  Maximize2,
  Loader2,
  Wand2,
} from 'lucide-react';
import { AspectRatio, ImageStyle, SubtitleSegment } from '../types';

interface ImageGeneratorProps {
  segments: SubtitleSegment[];
  lang: 'ar' | 'en';
}

interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  style: ImageStyle;
  timestamp: string;
}

const STYLE_OPTIONS: { id: ImageStyle; labelAr: string; labelEn: string; icon: string }[] = [
  { id: 'cinematic', labelAr: 'سينمائي (Cinematic)', labelEn: 'Cinematic Lighting', icon: '🎬' },
  { id: 'photorealistic', labelAr: 'واقعي فوتوغرافي', labelEn: 'Photorealistic 8K', icon: '📸' },
  { id: 'podcast-cover', labelAr: 'غلاف بودكاست عصري', labelEn: 'Modern Podcast Cover', icon: '🎙️' },
  { id: 'arabic-calligraphy', labelAr: 'خط وزخرفة عربية مذهبة', labelEn: 'Arabic Calligraphy Art', icon: '✨' },
  { id: 'digital-art', labelAr: 'فن رقمي ورسومات', labelEn: 'Digital Illustration', icon: '🎨' },
  { id: '3d-render', labelAr: 'ثلاثي الأبعاد (3D Octane)', labelEn: '3D Render', icon: '🧊' },
  { id: 'anime', labelAr: 'أنمي (Anime Aesthetic)', labelEn: 'Anime Aesthetic', icon: '🌸' },
  { id: 'cyberpunk', labelAr: 'سايبربانك ونيون', labelEn: 'Cyberpunk Neon', icon: '⚡' },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string; ratioClass: string }[] = [
  { id: '1:1', label: '1:1 مربع', desc: 'انستغرام / غلاف بودكاست', ratioClass: 'aspect-square' },
  { id: '16:9', label: '16:9 عريض', desc: 'يوتيوب وثمبنيل', ratioClass: 'aspect-video' },
  { id: '9:16', label: '9:16 طولي', desc: 'تيك توك وريلز وستوري', ratioClass: 'aspect-[9/16]' },
  { id: '4:3', label: '4:3 كلاسيكي', desc: 'عرض شاشة قياسي', ratioClass: 'aspect-[4/3]' },
];

const PRESET_PROMPTS = [
  'غلاف بودكاست تقني عصري مع موجات صوتية نيون متوهجة وميكروفون ذهبي ثلاثي الأبعاد',
  'لوحة فنية فاخرة للخط العربي مع نقوش أرابيسك مذهبة وإضاءة سينمائية درامية',
  'استوديو تسجيل صوتي وبث مباشر احترافي مع أضواء نيون أرجوانية وزرقاء وخلفية سينمائية',
  'شخص يستمع لسماعات رأس في مدينة مستقبلية مضيئة تحت المطر الخفيف بأسلوب سايبربانك',
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ segments, lang }) => {
  const isAr = lang === 'ar';

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto suggest cover prompt based on transcript
  const handleSuggestPrompt = async () => {
    if (segments.length === 0) {
      alert(isAr ? 'يرجى تفريغ ملف صوتي أولاً لاقتراح فكرة غلاف مناسبة لمحتواه!' : 'Transcribe audio first to suggest a cover!');
      return;
    }

    setIsSuggesting(true);
    try {
      const transcriptText = segments.map((s) => s.text).join(' ');
      const res = await fetch('/api/suggest-cover-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText }),
      });
      const data = await res.json();
      if (data.prompt) {
        setPrompt(data.prompt);
      }
    } catch (e) {
      console.error('Error suggesting prompt:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Generate Image
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة وصف للصورة أولاً!' : 'Please enter an image prompt first!');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setCurrentImage(data.imageUrl);

      const newItem: GeneratedImageItem = {
        id: Date.now().toString(),
        url: data.imageUrl,
        prompt: prompt.trim(),
        aspectRatio,
        style,
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US'),
      };

      setGallery((prev) => [newItem, ...prev]);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء توليد الصورة' : 'Error generating image'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const handleDownload = (imgUrl: string, filename = 'yaseen_ai_image.png') => {
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Image to clipboard
  const handleCopyImage = async (imgUrl: string) => {
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy URL
      navigator.clipboard.writeText(imgUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-pink-950/40 rounded-2xl border border-purple-800/40 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{isAr ? 'ميزة الذكاء الاصطناعي المدمجة' : 'Dedicated AI Image Feature'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isAr
              ? 'منشئ الصور والأغلفة بالذكاء الاصطناعي (AI Image Generator)'
              : 'AI Cover & Image Generator Studio'}
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {isAr
              ? 'صمّم صور مصغرة (Thumbnails) وأغلفة بودكاست جذابة متوافقة مع محتواك الصوتي بضغطة زر واحدة، مع دعم أبعاد اليوتيوب والتيك توك والانستغرام.'
              : 'Create eye-catching video thumbnails, podcast covers, and artwork matching your audio content with 1-click presets.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Input Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Prompt Input Box */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>{isAr ? 'وصف الصورة المراد إنشاؤها (Prompt):' : 'Image Description (Prompt):'}</span>
              </label>

              {/* Suggest prompt from transcript */}
              {segments.length > 0 && (
                <button
                  onClick={handleSuggestPrompt}
                  disabled={isSuggesting}
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold transition-colors"
                >
                  {isSuggesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isAr ? 'اقتراح غلاف من الصوت المفرغ ✨' : 'Suggest from audio ✨'}</span>
                </button>
              )}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب وصفاً دقيقاً للصورة بالعربية أو الإنجليزية، مثلاً: غلاف بودكاست فضائي عصري مع موجة صوتية متوهجة بدقة 8k...'
                  : 'Type a detailed description in Arabic or English, e.g. Modern podcast cover with neon glowing audio wave...'
              }
              rows={4}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />

            {/* Inspiration presets pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                {isAr ? 'أفكار جاهزة للتجربة السريعة:' : 'Quick Prompt Ideas:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition-all text-right truncate max-w-full"
                  >
                    {p.substring(0, 45)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style Selector */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>{isAr ? 'النمط الفني (Artistic Style):' : 'Artistic Style:'}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all text-center ${
                    style === opt.id
                      ? 'bg-purple-600/25 border-purple-500 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="truncate w-full">{isAr ? opt.labelAr.split(' ')[0] : opt.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Ratio className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'أبعاد الصورة (Aspect Ratio):' : 'Aspect Ratio:'}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAspectRatio(item.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all text-center ${
                    aspectRatio === item.id
                      ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm font-mono text-indigo-300">{item.id}</span>
                  <span className="text-[10px] text-slate-400 truncate w-full">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 px-6 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl ${
              isGenerating
                ? 'bg-purple-800 text-purple-200 cursor-wait animate-pulse'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isAr ? 'جاري رسم وتوليد الصورة بالذكاء الاصطناعي...' : 'Generating AI Image...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>{isAr ? 'إنشاء الصورة الآن (Generate Image)' : 'Generate AI Image Now'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right / Preview & Download Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>{isAr ? 'معاينة الصورة وتنزيلها' : 'Image Preview & Download'}</span>
              </h3>

              {currentImage && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                    {aspectRatio}
                  </span>
                </div>
              )}
            </div>

            {/* Image Canvas / Container */}
            <div className="my-auto py-4 flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin flex items-center justify-center"></div>
                    <Sparkles className="w-8 h-8 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-200">
                      {isAr ? 'الذكاء الاصطناعي يرسم تحفتك الآن...' : 'AI is painting your image...'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr ? 'توليد عالي الدقة بمواصفات الإضاءة المحددة' : 'High resolution rendering in progress'}
                    </p>
                  </div>
                </div>
              ) : currentImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-2xl max-h-[380px] w-full flex items-center justify-center bg-black/60">
                  <img
                    src={currentImage}
                    alt={prompt}
                    className="max-h-[380px] w-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-xs text-white line-clamp-2">{prompt}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      {isAr ? 'لم يتم إنشاء صورة بعد' : 'No image generated yet'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr
                        ? 'اكتب وصفاً واضغط زر "إنشاء الصورة الآن" لرؤية النتيجة هنا'
                        : 'Enter a prompt and hit Generate to see it live here'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Download and Copy Actions */}
            {currentImage && (
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownload(currentImage)}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تنزيل الصورة (PNG/JPG)' : 'Download Image'}</span>
                </button>

                <button
                  onClick={() => handleCopyImage(currentImage)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-pink-400" />
                      <span>{isAr ? 'نسخ الصورة' : 'Copy Image'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Session History Gallery */}
          {gallery.length > 1 && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300">
                {isAr ? 'معرض الصور السابقة في هذه الجلسة:' : 'Previous Generated Images:'}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {gallery.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentImage(item.url);
                      setPrompt(item.prompt);
                    }}
                    className={`rounded-lg overflow-hidden border transition-all ${
                      currentImage === item.url
                        ? 'border-purple-500 ring-2 ring-purple-400'
                        : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={item.url} alt={item.prompt} className="w-full h-16 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
