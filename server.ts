import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for large audio files
app.use(express.json({ limit: '65mb' }));
app.use(express.urlencoded({ extended: true, limit: '65mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Audio Transcription with Precise Timestamps
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType, language = 'Modern Standard Arabic (الفصحى)', wordsPerLine = 5 } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Clean base64 string
    const base64Data = audioData.replace(/^data:[^;]+;base64,/, '');

    const dialectInstructions: Record<string, string> = {
      'Modern Standard Arabic (الفصحى)': 'Modern Standard Arabic with accurate diacritics and formal vocabulary (العربية الفصحى).',
      'Egyptian Arabic (العامية المصرية)': 'Egyptian Arabic colloquial dialect as naturally spoken (العامية المصرية الدارجة).',
      'Levantine Arabic (اللهجة الشامية)': 'Levantine Arabic dialect (Syrian, Lebanese, Palestinian, Jordanian) (اللهجة الشامية).',
      'Gulf Arabic (اللهجة الخليجية)': 'Gulf Arabic dialect (Saudi, Emirati, Kuwaiti, Qatari, Bahraini, Omani) (اللهجة الخليجية).',
      'English (الإنجليزية)': 'English language with natural spelling and punctuation.',
      'Moroccan Arabic (الدارجة المغربية)': 'Moroccan Darija Arabic (الدارجة المغربية).',
    };

    const dialectGuidance = dialectInstructions[language] || `Target language/dialect: ${language}`;

    const prompt = `You are an elite, millisecond-accurate speech-to-text subtitling engine specialized in Arabic and international dialects.
Target Dialect: ${dialectGuidance}
Target Words Per Subtitle Line: approximately ${wordsPerLine} words per line.

CRITICAL INSTRUCTIONS:
1. Listen thoroughly to the audio and transcribe every spoken word accurately without missing or adding words.
2. Synchronize timestamps (start and end in SECONDS as floating-point numbers, e.g., 1.25).
3. Timestamps MUST match the exact acoustic onset and offset of spoken words. Never make captions lag behind or lead ahead of the speaker.
4. Break into logical, natural subtitle segments of roughly ${wordsPerLine} words each (or natural punctuation boundaries).
5. For each segment, also provide an array of individual 'words' with their specific start and end timestamps so the client can dynamically re-split words per line if requested.

Return ONLY a JSON object with this exact structure:
{
  "language": "${language}",
  "totalDuration": 0.0,
  "segments": [
    {
      "id": 1,
      "start": 0.0,
      "end": 2.5,
      "text": "النص الصوتي المسموع هنا",
      "words": [
        { "word": "النص", "start": 0.0, "end": 0.6 },
        { "word": "الصوتي", "start": 0.65, "end": 1.2 },
        { "word": "المسموع", "start": 1.25, "end": 1.9 },
        { "word": "هنا", "start": 1.95, "end": 2.5 }
      ]
    }
  ]
}`;

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/mp3',
        data: base64Data,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [audioPart, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean up markdown block if present
      const cleaned = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    if (!parsedData.segments || !Array.isArray(parsedData.segments)) {
      return res.status(500).json({ error: 'Failed to extract structured subtitle segments from audio.' });
    }

    return res.json({
      success: true,
      language: parsedData.language || language,
      totalDuration: parsedData.totalDuration || 0,
      segments: parsedData.segments,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: error.message || 'Error occurred while transcribing audio',
    });
  }
});

// API: Generate Image using AI
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', style = 'cinematic' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const styleModifiers: Record<string, string> = {
      cinematic: 'cinematic lighting, 8k resolution, dramatic atmosphere, photorealistic, masterpiece, depth of field',
      photorealistic: 'hyperrealistic, highly detailed photograph, 85mm lens, f/1.8, natural lighting, ultra high definition',
      'digital-art': 'vibrant digital art illustration, clean vector shapes, artistic lighting, trending on artstation',
      anime: 'anime aesthetic, Makoto Shinkai style, vibrant colors, detailed sky, beautiful lighting, high quality anime screencap',
      'arabic-calligraphy': 'ornate Arabic typography and calligraphy art, gilded gold patterns, Islamic geometric arabesque, opulent, modern art',
      'podcast-cover': 'professional modern podcast cover thumbnail, bold typography, sleek gradient, minimalist graphic design, 4k vector',
      '3d-render': 'octane render 3D, blender, volumetric lighting, vibrant textures, clay and glass materials, 8k',
      cyberpunk: 'cyberpunk neon glow, futuristic city lights, dark moody synthwave aesthetic, high contrast',
    };

    const styleEnhancement = styleModifiers[style] || styleModifiers['cinematic'];
    const enhancedPrompt = `${prompt}, ${styleEnhancement}`;

    // Dimensions based on aspect ratio
    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (aspectRatio === '4:3') {
      width = 1024;
      height = 768;
    }

    // Build reliable AI image URL via Pollinations AI
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const seed = Math.floor(Math.random() * 9999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    // Fetch image as buffer so client has direct base64 data URL for fast offline download and preview
    try {
      const imgRes = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Yaseen-Caption/1.0' },
      });
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        return res.json({
          success: true,
          imageUrl: dataUrl,
          directUrl: imageUrl,
          enhancedPrompt,
          aspectRatio,
        });
      }
    } catch (fetchErr) {
      console.warn('Direct fetch failed, returning direct URL:', fetchErr);
    }

    return res.json({
      success: true,
      imageUrl: imageUrl,
      directUrl: imageUrl,
      enhancedPrompt,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// API: Generate Creative Image Prompt from Subtitle text
app.post('/api/suggest-cover-prompt', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Based on the following audio subtitle transcript, generate a single-sentence vivid English visual prompt for generating a stunning thumbnail or cover artwork:
Transcript: "${transcript.substring(0, 800)}"

Return ONLY the raw prompt text without quotes, markdown, or prefix. Under 35 words.`,
    });

    const raw = response.text || '';
    const cleaned = raw
      .replace(/^[\s*#>"'`]+|[\s*#>"'`]+$/g, '')
      .replace(/^(visual prompt|prompt):\s*/i, '')
      .replace(/[*_#]/g, '')
      .trim();

    return res.json({
      prompt: cleaned || 'A modern artistic sound wave concept with vibrant glowing colors',
    });
  } catch (error: any) {
    console.error('Prompt suggestion error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate prompt' });
  }
});

// Serve frontend
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 ياسين كابشن (Yaseen Caption) Server running at http://localhost:${PORT}`);
});
