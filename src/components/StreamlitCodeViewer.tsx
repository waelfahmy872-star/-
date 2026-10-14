import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, Terminal, ExternalLink, Cpu } from 'lucide-react';
import { downloadFile } from '../utils/srtFormatter';

interface StreamlitCodeViewerProps {
  lang: 'ar' | 'en';
}

const STREAMLIT_PYTHON_CODE = `"""
ياسين كابشن - Yaseen Caption
==============================================
تطبيق متكامل لمعالجة الصوتيات وتوليد ملفات الترجمة SRT المتزامنة 100%
مع قسم توليد الصور بالذكاء الاصطناعي (AI Image Generator)

How to Run / طريقة التشغيل:
1. Install requirements:
   pip install streamlit google-genai requests pillow
2. Set your Gemini API Key:
   export GEMINI_API_KEY="YOUR_API_KEY"
3. Run the app:
   streamlit run app.py
"""

import os
import io
import json
import base64
import requests
import streamlit as st
from PIL import Image

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

# ==========================================================
# 1. Page Configuration & Custom CSS (RTL & Styling)
# ==========================================================
st.set_page_config(
    page_title="ياسين كابشن - Yaseen Caption",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for modern dark theme and Arabic typography
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Cairo', sans-serif !important;
        direction: rtl;
        text-align: right;
    }
    
    .main-title {
        font-size: 2.8rem;
        font-weight: 900;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin-bottom: 0.2rem;
    }
    
    .sub-title {
        font-size: 1.15rem;
        color: #94a3b8;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .caption-box {
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.2rem;
        margin-bottom: 1rem;
    }
    
    .time-badge {
        background-color: #3b82f6;
        color: white;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-family: monospace;
        direction: ltr;
        display: inline-block;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================================
# 2. Helper Functions: SRT Formatting & Rechunking
# ==========================================================
def format_seconds_to_srt_time(seconds: float) -> str:
    millis = int(round((seconds - int(seconds)) * 1000))
    total_seconds = int(seconds)
    secs = total_seconds % 60
    total_minutes = total_seconds // 60
    mins = total_minutes % 60
    hours = total_minutes // 60
    return f"{hours:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def generate_srt_content(segments: list) -> str:
    srt_lines = []
    for idx, seg in enumerate(segments, start=1):
        start_time = format_seconds_to_srt_time(float(seg.get("start", 0.0)))
        end_time = format_seconds_to_srt_time(float(seg.get("end", 0.0)))
        text = seg.get("text", "").strip()
        
        srt_lines.append(f"{idx}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(text)
        srt_lines.append("")
    return "\\n".join(srt_lines)

def rechunk_by_words(segments: list, words_per_line: int) -> list:
    all_words = []
    for seg in segments:
        words = seg.get("words", [])
        if words and len(words) > 0:
            for w in words:
                all_words.append({
                    "word": w.get("word", "").strip(),
                    "start": float(w.get("start", seg.get("start", 0))),
                    "end": float(w.get("end", seg.get("end", 0)))
                })
        else:
            seg_text_words = seg.get("text", "").split()
            if not seg_text_words:
                continue
            seg_start = float(seg.get("start", 0))
            seg_end = float(seg.get("end", 0))
            seg_dur = max(0.1, seg_end - seg_start)
            step = seg_dur / len(seg_text_words)
            for i, w in enumerate(seg_text_words):
                all_words.append({
                    "word": w,
                    "start": seg_start + (i * step),
                    "end": seg_start + ((i + 1) * step)
                })

    if not all_words:
        return segments

    new_segments = []
    for i in range(0, len(all_words), words_per_line):
        chunk = all_words[i:i + words_per_line]
        chunk_text = " ".join([item["word"] for item in chunk])
        chunk_start = chunk[0]["start"]
        chunk_end = chunk[-1]["end"]
        new_segments.append({
            "id": len(new_segments) + 1,
            "start": round(chunk_start, 3),
            "end": round(chunk_end, 3),
            "text": chunk_text,
            "words": chunk
        })
    return new_segments

# ==========================================================
# 3. Main Header
# ==========================================================
st.markdown("<h1 class='main-title'>ياسين كابشن | Yaseen Caption</h1>", unsafe_allow_html=True)
st.markdown("<p class='sub-title'>المنظومة الاحترافية لتحويل الصوت إلى ملفات ترجمة SRT متزامنة 100% بدقة الكلمة + توليد الصور بالذكاء الاصطناعي</p>", unsafe_allow_html=True)

# Tabs
tab_subtitles, tab_image_gen, tab_docs = st.tabs([
    "🎙️ توليد الترجمة المتزامنة (SRT)",
    "🎨 منشئ الصور بالذكاء الاصطناعي",
    "📖 دليل التشغيل والميزات"
])

# Initialize session state
if "segments" not in st.session_state:
    st.session_state.segments = []
if "srt_text" not in st.session_state:
    st.session_state.srt_text = ""
if "audio_bytes" not in st.session_state:
    st.session_state.audio_bytes = None

# ==========================================================
# TAB 1: Audio to SRT Synchronized Subtitles
# ==========================================================
with tab_subtitles:
    col_controls, col_preview = st.columns([1, 1.2], gap="large")

    with col_controls:
        st.subheader("⚙️ إعدادات المعالجة والتحكم")
        
        uploaded_audio = st.file_uploader(
            "اختر ملف الصوت (MP3, WAV, M4A, OGG, FLAC)",
            type=["mp3", "wav", "m4a", "ogg", "flac"]
        )

        col_c1, col_c2 = st.columns(2)
        with col_c1:
            words_per_line = st.selectbox(
                "عدد الكلمات في السطر (Words per line):",
                options=[3, 5, 7, 10, 12],
                index=1
            )

        with col_c2:
            language_dialect = st.selectbox(
                "اللغة واللهجة (Language & Dialect):",
                options=[
                    "Modern Standard Arabic (الفصحى)",
                    "Egyptian Arabic (العامية المصرية)",
                    "Levantine Arabic (اللهجة الشامية)",
                    "Gulf Arabic (اللهجة الخليجية)",
                    "English (الإنجليزية)",
                    "Moroccan Arabic (الدارجة المغربية)"
                ],
                index=0
            )

        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            api_key = st.text_input("مفتاح Gemini API Key:", type="password")

        if st.button("🚀 بدء التفريغ والمزامنة الدقيقة (100% Sync)", use_container_width=True, type="primary"):
            if not uploaded_audio:
                st.error("⚠️ يرجى رفع ملف صوتي أولاً!")
            elif not api_key:
                st.error("⚠️ يرجى توفير مفتاح Gemini API Key.")
            else:
                with st.spinner("⏳ جاري الاستماع للصوت واستخراج البصمات الزمنية بدقة 100%..."):
                    try:
                        audio_data = uploaded_audio.read()
                        st.session_state.audio_bytes = audio_data
                        mime_type = uploaded_audio.type or "audio/mp3"
                        
                        client = genai.Client(api_key=api_key)
                        prompt = f"""You are an elite, millisecond-accurate audio subtitling engine.
Target Language/Dialect: {language_dialect}.
Target Words Per Line: roughly {words_per_line} words.

CRITICAL INSTRUCTIONS:
1. Transcribe the audio verbatim in {language_dialect} with 100% synchronization.
2. Timestamps must strictly match the acoustic speech boundaries (start & end in seconds).
3. Provide word-level timestamps inside the 'words' array for each segment.

Output JSON format:
{{
  "language": "{language_dialect}",
  "segments": [
    {{
      "id": 1,
      "start": 0.0,
      "end": 2.5,
      "text": "النص المنطوق هنا",
      "words": [
        {{"word": "النص", "start": 0.0, "end": 0.6}},
        {{"word": "المنطوق", "start": 0.65, "end": 1.8}},
        {{"word": "هنا", "start": 1.85, "end": 2.5}}
      ]
    }}
  ]
}}"""

                        response = client.models.generate_content(
                            model="gemini-3.8-flash",
                            contents=[
                                types.Part.from_bytes(data=audio_data, mime_type=mime_type),
                                prompt
                            ],
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json"
                            )
                        )

                        result = json.loads(response.text)
                        raw_segments = result.get("segments", [])
                        
                        adjusted_segments = rechunk_by_words(raw_segments, words_per_line)
                        st.session_state.segments = adjusted_segments
                        st.session_state.srt_text = generate_srt_content(adjusted_segments)
                        st.success("✅ تم استخراج ومزامنة الترجمة بنجاح!")
                    except Exception as e:
                        st.error(f"❌ حدث خطأ أثناء المعالجة: {str(e)}")

    with col_preview:
        st.subheader("📺 المعاينة المباشرة وتنزيل ملف SRT")
        
        if st.session_state.audio_bytes:
            st.audio(st.session_state.audio_bytes)
            
        if st.session_state.segments:
            st.download_button(
                label="📥 تنزيل ملف الترجمة (Download SRT File)",
                data=st.session_state.srt_text,
                file_name="yaseen_caption.srt",
                mime="application/x-subrip",
                use_container_width=True,
                type="primary"
            )
            
            st.markdown("### 📝 معاينة أسطر الترجمة المتزامنة:")
            for seg in st.session_state.segments:
                s_str = format_seconds_to_srt_time(seg['start'])
                e_str = format_seconds_to_srt_time(seg['end'])
                st.markdown(f"""
                <div class="caption-box">
                    <span class="time-badge">{s_str} ➔ {e_str}</span>
                    <p style="font-size: 1.15rem; font-weight: 600; margin-top: 8px; color: #f8fafc;">{seg['text']}</p>
                </div>
                """, unsafe_allow_html=True)
                
            with st.expander("📄 عرض النص المصدري لملف SRT"):
                st.text_area("كود SRT الكامل", st.session_state.srt_text, height=250)
        else:
            st.info("💡 قم برفع ملف صوتي والضغط على زر البدء لتظهر المعاينة هنا.")

# ==========================================================
# TAB 2: AI Image Generation Feature
# ==========================================================
with tab_image_gen:
    st.subheader("🎨 منشئ الصور بالذكاء الاصطناعي (AI Image Generator)")

    prompt_text = st.text_area(
        "اكتب وصف الصورة (Prompt):",
        placeholder="مثال: غلاف بودكاست عصري مع موجات صوتية نيون وخط عربي مذهب"
    )

    if st.button("✨ إنشاء الصورة الآن", type="primary"):
        if prompt_text:
            with st.spinner("🎨 جاري توليد الصورة..."):
                import urllib.parse
                encoded = urllib.parse.quote(prompt_text)
                url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&model=flux"
                img_res = requests.get(url, timeout=30)
                if img_res.status_code == 200:
                    img = Image.open(io.BytesIO(img_res.content))
                    st.image(img, caption=prompt_text, use_container_width=True)
                    buf = io.BytesIO()
                    img.save(buf, format="PNG")
                    st.download_button(
                        label="📥 تنزيل الصورة (Download PNG)",
                        data=buf.getvalue(),
                        file_name="yaseen_image.png",
                        mime="image/png"
                    )
`;

export const StreamlitCodeViewer: React.FC<StreamlitCodeViewerProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(STREAMLIT_PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPy = () => {
    downloadFile(STREAMLIT_PYTHON_CODE, 'app.py', 'text/x-python;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 rounded-2xl border border-emerald-800/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>{isAr ? 'كود بايثون متكامل في ملف واحد' : 'Single-File Python Streamlit Script'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isAr ? 'كود تطبيق Streamlit الكامل (app.py)' : 'Complete Streamlit Python Application Code'}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'وفقاً لطلبك، قمنا ببرمجة الكود البرمجي الكامل لتطبيق ستريمليت في ملف بايثون واحد مستقل جاهز للتشغيل مباشرة.'
                : 'As requested, here is the complete single-file Streamlit Python script ready to copy, download, and run locally.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadPy}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تنزيل ملف app.py' : 'Download app.py'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'نسخ الكود' : 'Copy Code'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Execution Guide */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'خطوات التشغيل عبر الطرفية (How to Run Locally):' : 'Terminal Run Instructions:'}</span>
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 select-all" dir="ltr">
          <p className="text-slate-500"># 1. Install dependencies</p>
          <p className="text-emerald-400">pip install streamlit google-genai requests pillow</p>
          <p className="text-slate-500 mt-2"># 2. Export your Gemini API key</p>
          <p className="text-emerald-400">export GEMINI_API_KEY="your-gemini-api-key"</p>
          <p className="text-slate-500 mt-2"># 3. Launch Streamlit web app</p>
          <p className="text-emerald-400">streamlit run app.py</p>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400">app.py</span>
          <span className="text-xs text-emerald-400 font-semibold">{isAr ? 'بايثون 3.9+' : 'Python 3.9+'}</span>
        </div>

        <pre
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-emerald-500/30"
          dir="ltr"
        >
          <code>{STREAMLIT_PYTHON_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
