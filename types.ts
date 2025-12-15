export interface Message {
  id: string;
  sender: 'user' | 'rose';
  text: string; // The transcript or the user's text
  audioData?: Uint8Array; // Raw PCM data for Rose's voice
  timestamp: Date;
  isAudio: boolean;
  autoPlay?: boolean; // New flag to trigger automatic playback
}

export enum RoseState {
  IDLE = 'idle',
  THINKING = 'thinking', // Generating text
  RECORDING = 'recording', // Generating audio
  SPEAKING = 'speaking', // Playing audio
}