export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: WordTimestamp[];
}

export type DialectOption =
  | 'Modern Standard Arabic (الفصحى)'
  | 'Egyptian Arabic (العامية المصرية)'
  | 'Levantine Arabic (اللهجة الشامية)'
  | 'Gulf Arabic (اللهجة الخليجية)'
  | 'English (الإنجليزية)'
  | 'Moroccan Arabic (الدارجة المغربية)';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

export type ImageStyle =
  | 'cinematic'
  | 'photorealistic'
  | 'digital-art'
  | 'anime'
  | 'arabic-calligraphy'
  | 'podcast-cover'
  | '3d-render'
  | 'cyberpunk';
