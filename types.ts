
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 encoded image string
  video?: string; // Base64 encoded video string (mp4)
  audio?: string; // Base64 encoded PCM audio string
  mapData?: any[]; // Grounding metadata for maps
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  isStory?: boolean;
  isAudio?: boolean; // Flag for explicit audio generation messages
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-2.5-flash-image',
  VEO = 'veo-3.1-fast-generate-preview',
  MATH = 'gemini-3-pro-preview',
  MAPS = 'gemini-2.5-flash'
}

export type VideoResolution = '720p' | '1080p';

export type Theme = 'midnight' | 'obsidian' | 'dune' | 'forest' | 'desert' | 'ocean';
