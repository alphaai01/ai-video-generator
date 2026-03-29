export interface VideoJob {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  videoUrl?: string;
  duration: number;
  resolution: string;
}

export interface VideoStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export interface GenerationSettings {
  duration: 4 | 8 | 12;
  resolution: '720p' | '1080p';
  aspectRatio: AspectRatio;
  includeNarration: boolean;
  narrationText: string;
}

export interface VideoHistoryItem {
  id: string;
  prompt: string;
  thumbnail?: string;
  videoUrl: string;
  timestamp: string;
  duration: number;
  resolution: string;
}

export interface GenerateTextRequest {
  prompt: string;
  duration: number;
  resolution: string;
  aspectRatio?: string;
  narrationText?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  duration?: number;
  resolution?: string;
}

export interface SpeechToTextRequest {
  audio: Blob;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
