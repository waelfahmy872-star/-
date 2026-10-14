"""
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
    
    .stButton>button {
        border-radius: 10px;
        font-weight: 700;
        transition: all 0.2s;
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
    """Formats float seconds into SRT timestamp 00:00:00,000"""
    millis = int(round((seconds - int(seconds)) * 1000))
    total_seconds = int(seconds)
    secs = total_seconds % 60
    total_minutes = total_seconds // 60
    mins = total_minutes % 60
    hours = total_minutes // 60
    return f"{hours:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def generate_srt_content(segments: list) -> str:
    """Generates standard .srt string from segments list"""
    srt_lines = []
    for idx, seg in enumerate(segments, start=1):
        start_time = format_seconds_to_srt_time(float(seg.get("start", 0.0)))
        end_time = format_seconds_to_srt_time(float(seg.get("end", 0.0)))
        text = seg.get("text", "").strip()
        
        srt_lines.append(f"{idx}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(text)
        srt_lines.append("")
    return "\n".join(srt_lines)

def rechunk_by_words(segments: list, words_per_line: int) -> list:
    """Re-chunks subtitles to strictly fit the requested words per line while preserving timestamps"""
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
            # Interpolate word timestamps from segment
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
        
        # Audio File Upload
        uploaded_audio = st.file_uploader(
            "اختر ملف الصوت (MP3, WAV, M4A, OGG, FLAC)",
            type=["mp3", "wav", "m4a", "ogg", "flac"],
            help="قم برفع الملف الصوتي لبدء عملية التفريغ والتحليل الزمني"
        )

        # Customization Controls (UI Requirements)
        col_c1, col_c2 = st.columns(2)
        with col_c1:
            words_per_line = st.selectbox(
                "عدد الكلمات في السطر (Words per line):",
                options=[3, 5, 7, 10, 12],
                index=1,
                help="يتحكم في طول كل سطر ترجمة ومعدل ظهور الكلمات"
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
                index=0,
                help="اختر اللهجة بدقة لضمان أعلى مستوى من التعرف الصوتي والتزامن"
            )

        # API Key handling
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            api_key = st.text_input("مفتاح Gemini API Key (اختياري إذا تم تعيينه في البيئة):", type="password")

        # Process Button
        if st.button("🚀 بدء التفريغ والمزامنة الدقيقة (100% Sync)", use_container_width=True, type="primary"):
            if not uploaded_audio:
                st.error("⚠️ يرجى رفع ملف صوتي أولاً!")
            elif not api_key:
                st.error("⚠️ يرجى توفير مفتاح Gemini API Key في متغيرات البيئة أو في الحقل أعلاه.")
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
                        
                        # Rechunk by selected words_per_line
                        adjusted_segments = rechunk_by_words(raw_segments, words_per_line)
                        st.session_state.segments = adjusted_segments
                        st.session_state.srt_text = generate_srt_content(adjusted_segments)
                        st.success("✅ تم استخراج ومزامنة الترجمة بنجاح!")
                    except Exception as e:
                        st.error(f"❌ حدث خطأ أثناء المعالجة: {str(e)}")

    with col_preview:
        st.subheader("📺 المعاينة المباشرة وتنزيل ملف SRT")
        
        # Audio Player if audio exists
        if st.session_state.audio_bytes:
            st.audio(st.session_state.audio_bytes)
            
        if st.session_state.segments:
            # Download SRT Button
            st.download_button(
                label="📥 تنزيل ملف الترجمة (Download SRT File)",
                data=st.session_state.srt_text,
                file_name="yaseen_caption.srt",
                mime="application/x-subrip",
                use_container_width=True,
                type="primary"
            )
            
            # Words per line live rechunker
            new_wpl = st.slider("إعادة تقسيم الكلمات لكل سطر لحظياً:", min_value=2, max_value=15, value=words_per_line)
            if new_wpl != words_per_line:
                st.session_state.segments = rechunk_by_words(st.session_state.segments, new_wpl)
                st.session_state.srt_text = generate_srt_content(st.session_state.segments)
                st.rerun()

            # Live preview container
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
                
            # Raw SRT text view
            with st.expander("📄 عرض النص المصدري لملف SRT"):
                st.text_area("كود SRT الكامل", st.session_state.srt_text, height=250)
        else:
            st.info("💡 قم برفع ملف صوتي والضغط على زر البدء لتظهر المعاينة هنا.")

# ==========================================================
# TAB 2: AI Image Generation Feature
# ==========================================================
with tab_image_gen:
    st.subheader("🎨 منشئ الصور بالذكاء الاصطناعي (AI Image Generator)")
    st.write("قم بكتابة وصف للصورة لإنشاء غلاف أو صورة مصغرة (Thumbnail) تناسب ملفك الصوتي أو أي فكرة إبداعية.")

    col_img_input, col_img_output = st.columns([1, 1], gap="large")

    with col_img_input:
        prompt_text = st.text_area(
            "اكتب وصف الصورة (Prompt):",
            placeholder="مثال: غلاف بودكاست عصري مع موجات صوتية نيون ثلاثية الأبعاد وخط عربي مذهب",
            height=120
        )
        
        col_s1, col_s2 = st.columns(2)
        with col_s1:
            aspect_ratio = st.selectbox(
                "الأبعاد (Aspect Ratio):",
                options=["1:1 (مربع)", "16:9 (عريض يوتيوب)", "9:16 (طولي تيك توك / ريلز)", "4:3 (كلاسيكي)"],
                index=0
            )
        with col_s2:
            img_style = st.selectbox(
                "النمط الفني (Artistic Style):",
                options=[
                    "Cinematic (سينمائي)",
                    "Photorealistic (واقعي فوتوغرافي)",
                    "Digital Art (فن رقمي حديث)",
                    "Arabic Calligraphy (خط وزخرفة عربية)",
                    "Podcast Cover (غلاف بودكاست عصري)",
                    "3D Render (مجسم ثلاثي الأبعاد)",
                    "Anime / Manga (أنمي)"
                ],
                index=0
            )

        # Quick Suggestion from transcript
        if st.session_state.segments:
            if st.button("✨ توليد فكرة غلاف تلقائياً من محتوى الصوت المفرغ"):
                all_text = " ".join([s["text"] for s in st.session_state.segments[:5]])
                st.session_state.generated_prompt = f"Modern aesthetic video thumbnail depicting {all_text[:80]}, high resolution, cinematic lighting"
                st.info(f"تم اقتراح: {st.session_state.generated_prompt}")

        generate_img_btn = st.button("✨ إنشاء الصورة الآن", type="primary", use_container_width=True)

    with col_img_output:
        if generate_img_btn:
            if not prompt_text:
                st.warning("⚠️ يرجى كتابة وصف للصورة أولاً!")
            else:
                with st.spinner("🎨 جاري رسم الصورة وتوليدها بالذكاء الاصطناعي..."):
                    try:
                        # Map dimensions
                        dims = {
                            "1:1 (مربع)": (1024, 1024),
                            "16:9 (عريض يوتيوب)": (1280, 720),
                            "9:16 (طولي تيك توك / ريلز)": (720, 1280),
                            "4:3 (كلاسيكي)": (1024, 768)
                        }
                        w, h = dims.get(aspect_ratio, (1024, 1024))
                        
                        style_tags = {
                            "Cinematic (سينمائي)": "cinematic lighting, photorealistic 8k, dramatic atmosphere",
                            "Photorealistic (واقعي فوتوغرافي)": "hyperrealistic photography, natural lighting, sharp focus",
                            "Digital Art (فن رقمي حديث)": "digital illustration, vibrant colors, trending on artstation",
                            "Arabic Calligraphy (خط وزخرفة عربية)": "luxurious Arabic calligraphy, gilded gold patterns, arabesque",
                            "Podcast Cover (غلاف بودكاست عصري)": "modern minimalist podcast cover thumbnail, bold typography",
                            "3D Render (مجسم ثلاثي الأبعاد)": "octane 3D render, blender 3D, volumetric lighting",
                            "Anime / Manga (أنمي)": "anime studio aesthetic, vibrant scenic sky, highly detailed"
                        }
                        extra = style_tags.get(img_style, "high quality")
                        final_prompt = f"{prompt_text}, {extra}"
                        
                        import urllib.parse
                        encoded = urllib.parse.quote(final_prompt)
                        seed = 42
                        url = f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&seed={seed}&nologo=true&model=flux"
                        
                        img_response = requests.get(url, timeout=30)
                        if img_response.status_code == 200:
                            img = Image.open(io.BytesIO(img_response.content))
                            st.image(img, caption=prompt_text, use_container_width=True)
                            
                            # Download button for Image
                            buf = io.BytesIO()
                            img.save(buf, format="PNG")
                            st.download_button(
                                label="📥 تنزيل الصورة بدقة كاملة (Download PNG)",
                                data=buf.getvalue(),
                                file_name="yaseen_ai_image.png",
                                mime="image/png",
                                use_container_width=True,
                                type="primary"
                            )
                        else:
                            st.error("تعذر توليد الصورة، يرجى المحاولة مرة أخرى.")
                    except Exception as err:
                        st.error(f"حدث خطأ أثناء توليد الصورة: {str(err)}")
        else:
            st.info("🖼️ ستظهر الصورة المنشأة هنا فور الضغط على زر الإنشاء.")

# ==========================================================
# TAB 3: Documentation & Instructions
# ==========================================================
with tab_docs:
    st.markdown("""
    ### 📖 كيفية استخدام تطبيق ياسين كابشن (Yaseen Caption):
    
    1. **رفع الملف الصوتي**: يدعم التطبيق صيغ MP3, WAV, M4A, OGG, FLAC.
    2. **تحديد اللهجة**: اختر بدقة بين الفصحى، المصرية، الشامية، الخليجية، الإنجليزية لضمان تطابق تام في المصطلحات والتشكيل.
    3. **تحديد الكلمات في السطر**: اختر 3 أو 5 أو 7 أو 10 كلمات بما يناسب فيديوهات تيك توك، ريلز، أو يوتيوب.
    4. **التزامن الدقيق 100%**: يتم استخراج التوقيتات على مستوى الكلمة بدقة أجزاء الثانية لضمان عدم تأخر أو تقدم الترجمة.
    5. **توليد الصور**: يمكنك توليد أغلفة جذابة وصور مصغرة لفيديوهاتك بجميع الأبعاد بضغطة زر واحدة.
    
    #### 💻 تشغيل التطبيق محلياً عبر بايثون:
    ```bash
    pip install streamlit google-genai requests pillow
    export GEMINI_API_KEY="your-api-key-here"
    streamlit run app.py
    ```
    """)
