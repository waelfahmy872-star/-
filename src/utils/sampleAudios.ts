import { SubtitleSegment } from '../types';

export interface SampleAudio {
  id: string;
  title: string;
  dialect: string;
  duration: number;
  description: string;
  demoSegments: SubtitleSegment[];
}

export const SAMPLE_AUDIOS: SampleAudio[] = [
  {
    id: 'arabic-msa',
    title: 'العربية الفصحى (Modern Standard Arabic)',
    dialect: 'Modern Standard Arabic (الفصحى)',
    duration: 6.8,
    description: 'مقطع إذاعي فصيح مع مخارج حروف واضحة ونبرة إخبارية',
    demoSegments: [
      {
        id: 1,
        start: 0.0,
        end: 2.1,
        text: 'أهلاً بكم في تطبيق ياسين كابشن',
        words: [
          { word: 'أهلاً', start: 0.0, end: 0.4 },
          { word: 'بكم', start: 0.45, end: 0.75 },
          { word: 'في', start: 0.8, end: 0.95 },
          { word: 'تطبيق', start: 1.0, end: 1.45 },
          { word: 'ياسين', start: 1.5, end: 1.8 },
          { word: 'كابشن', start: 1.85, end: 2.1 },
        ],
      },
      {
        id: 2,
        start: 2.15,
        end: 4.5,
        text: 'أقوى أداة لتوليد ملفات الترجمة المتزامنة',
        words: [
          { word: 'أقوى', start: 2.15, end: 2.5 },
          { word: 'أداة', start: 2.55, end: 2.9 },
          { word: 'لتوليد', start: 2.95, end: 3.4 },
          { word: 'ملفات', start: 3.45, end: 3.8 },
          { word: 'الترجمة', start: 3.85, end: 4.15 },
          { word: 'المتزامنة', start: 4.2, end: 4.5 },
        ],
      },
      {
        id: 3,
        start: 4.55,
        end: 6.8,
        text: 'بدقة متناهية ومزامنة مئة بالمئة',
        words: [
          { word: 'بدقة', start: 4.55, end: 4.95 },
          { word: 'متناهية', start: 5.0, end: 5.6 },
          { word: 'ومزامنة', start: 5.65, end: 6.2 },
          { word: 'مئة', start: 6.25, end: 6.5 },
          { word: 'بالمئة', start: 6.55, end: 6.8 },
        ],
      },
    ],
  },
  {
    id: 'arabic-egyptian',
    title: 'العامية المصرية (Egyptian Arabic)',
    dialect: 'Egyptian Arabic (العامية المصرية)',
    duration: 5.6,
    description: 'حوار بودكاست مصري تلقائي وسريع',
    demoSegments: [
      {
        id: 1,
        start: 0.0,
        end: 2.0,
        text: 'إزيكوا يا شباب عاملين إيه النهارده',
        words: [
          { word: 'إزيكوا', start: 0.0, end: 0.5 },
          { word: 'يا', start: 0.52, end: 0.7 },
          { word: 'شباب', start: 0.72, end: 1.1 },
          { word: 'عاملين', start: 1.15, end: 1.5 },
          { word: 'إيه', start: 1.52, end: 1.7 },
          { word: 'النهارده', start: 1.72, end: 2.0 },
        ],
      },
      {
        id: 2,
        start: 2.05,
        end: 3.8,
        text: 'هنعمل ترجمة فورية للفيديو بضغطة زرار',
        words: [
          { word: 'هنعمل', start: 2.05, end: 2.5 },
          { word: 'ترجمة', start: 2.52, end: 2.85 },
          { word: 'فورية', start: 2.9, end: 3.2 },
          { word: 'للفيديو', start: 3.25, end: 3.5 },
          { word: 'بضغطة', start: 3.52, end: 3.65 },
          { word: 'زرار', start: 3.68, end: 3.8 },
        ],
      },
      {
        id: 3,
        start: 3.85,
        end: 5.6,
        text: 'والكلام نازل مع الصوت مظبوط بالمللي',
        words: [
          { word: 'والكلام', start: 3.85, end: 4.25 },
          { word: 'نازل', start: 4.3, end: 4.65 },
          { word: 'مع', start: 4.7, end: 4.85 },
          { word: 'الصوت', start: 4.9, end: 5.15 },
          { word: 'مظبوط', start: 5.2, end: 5.4 },
          { word: 'بالمللي', start: 5.45, end: 5.6 },
        ],
      },
    ],
  },
  {
    id: 'english-tech',
    title: 'English (الإنجليزية)',
    dialect: 'English (الإنجليزية)',
    duration: 6.2,
    description: 'Tech keynote demo with clear English articulation',
    demoSegments: [
      {
        id: 1,
        start: 0.0,
        end: 2.2,
        text: 'Welcome to Yaseen Caption studio',
        words: [
          { word: 'Welcome', start: 0.0, end: 0.5 },
          { word: 'to', start: 0.55, end: 0.7 },
          { word: 'Yaseen', start: 0.75, end: 1.3 },
          { word: 'Caption', start: 1.35, end: 1.8 },
          { word: 'studio', start: 1.85, end: 2.2 },
        ],
      },
      {
        id: 2,
        start: 2.25,
        end: 4.2,
        text: 'Generating perfectly synchronized subtitle files',
        words: [
          { word: 'Generating', start: 2.25, end: 2.75 },
          { word: 'perfectly', start: 2.8, end: 3.2 },
          { word: 'synchronized', start: 3.25, end: 3.8 },
          { word: 'subtitle', start: 3.85, end: 4.0 },
          { word: 'files', start: 4.05, end: 4.2 },
        ],
      },
      {
        id: 3,
        start: 4.25,
        end: 6.2,
        text: 'With zero lag and millisecond precision',
        words: [
          { word: 'With', start: 4.25, end: 4.45 },
          { word: 'zero', start: 4.5, end: 4.8 },
          { word: 'lag', start: 4.85, end: 5.15 },
          { word: 'and', start: 5.2, end: 5.35 },
          { word: 'millisecond', start: 5.4, end: 5.85 },
          { word: 'precision', start: 5.9, end: 6.2 },
        ],
      },
    ],
  },
];

/**
 * Synthesizes a valid audio WAV blob in browser for the sample preview
 * using Web Audio oscillator melodies and voice tones
 */
export function createSynthesizedAudio(duration = 6.0): Blob {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM subchunk size
  view.setUint16(20, 1, true); // audio format PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate melodic voice-formant modulated audio
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Human-like pitch modulation (180Hz - 220Hz speech frequency)
    const f0 = 190 + Math.sin(t * 3) * 25 + Math.sin(t * 8) * 15;
    const formant1 = Math.sin(2 * Math.PI * f0 * t);
    const formant2 = 0.5 * Math.sin(2 * Math.PI * f0 * 2.8 * t);
    const formant3 = 0.25 * Math.sin(2 * Math.PI * f0 * 5.2 * t);
    // Syllabic envelope modulation (speaking rhythm)
    const envelope = Math.max(0, Math.sin(t * 6.5) * Math.sin(t * 2.2));
    const sample = (formant1 + formant2 + formant3) * envelope * 0.45;
    
    // Clamp to 16-bit
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
