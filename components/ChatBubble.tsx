import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { decodeAudioData } from '../utils/audioUtils';

interface ChatBubbleProps {
  message: Message;
  audioContext: AudioContext | null;
  onPlayStart: (id: string) => void;
  onPlayEnd: () => void; // New callback when audio finishes
  currentlyPlayingId: string | null;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, audioContext, onPlayStart, onPlayEnd, currentlyPlayingId }) => {
  const isUser = message.sender === 'user';
  const isPlaying = currentlyPlayingId === message.id;
  const [duration, setDuration] = useState<number>(0);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const hasAutoPlayedRef = useRef<boolean>(false);

  useEffect(() => {
    // Pre-decode audio when message loads
    if (message.isAudio && message.audioData && audioContext) {
      try {
        const buffer = decodeAudioData(message.audioData, audioContext);
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        
        // Auto-play logic: If message asks for autoPlay and hasn't played yet
        if (message.autoPlay && !hasAutoPlayedRef.current) {
            hasAutoPlayedRef.current = true;
            // Short timeout to ensure UI renders first
            setTimeout(() => playAudio(buffer), 100);
        }
      } catch (e) {
        console.error("Error decoding audio", e);
      }
    }
  }, [message, audioContext]);

  useEffect(() => {
    // Stop playing if another message starts playing
    if (!isPlaying && sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // Ignore if already stopped
        }
        sourceNodeRef.current = null;
    }
  }, [isPlaying]);

  const playAudio = (buffer: AudioBuffer) => {
    if (!audioContext) return;

    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.error("Could not resume audio context", e));
    }

    // Stop any existing source in this bubble
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
    }

    // Signal app that this ID is playing
    onPlayStart(message.id);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    source.onended = () => {
        if (sourceNodeRef.current === source) {
            sourceNodeRef.current = null;
            onPlayEnd(); // Signal completion
        }
    };

    sourceNodeRef.current = source;
    source.start();
  };

  const togglePlay = async () => {
    if (!audioContext || !message.isAudio || !audioBufferRef.current) return;

    if (isPlaying) {
      // Pause/Stop behavior
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      onPlayEnd();
    } else {
      // Manual play
      playAudio(audioBufferRef.current);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-pink-400 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-[80%]">
          <p className="text-sm leading-relaxed">{message.text}</p>
          <span className="text-[10px] opacity-70 mt-1 block text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  // Rose's message (Voice Note + Transcript)
  return (
    <div className="flex justify-start mb-4">
      <div className="flex flex-col max-w-[85%]">
        <div className="flex items-end gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 border-2 border-pink-500 flex items-center justify-center text-xs font-bold text-pink-600 mb-1">
                R
            </div>
            <div className="bg-teal-500 text-white p-3 rounded-2xl rounded-tl-sm shadow-lg w-full transition-all duration-300">
            
            {/* Audio Player UI */}
            {message.isAudio ? (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={togglePlay}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${isPlaying ? 'bg-white text-teal-600 shadow-inner' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                        aria-label={isPlaying ? "Stop voice note" : "Play voice note"}
                    >
                        {isPlaying ? (
                            <div className="flex gap-1">
                                <span className="w-1 h-3 bg-teal-500 rounded-full animate-[bounce_1s_infinite]"></span>
                                <span className="w-1 h-3 bg-teal-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                                <span className="w-1 h-3 bg-teal-500 rounded-full animate-[bounce_1s_infinite_0.4s]"></span>
                            </div>
                        ) : (
                            <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="h-1 bg-white/30 rounded-full w-full mb-1 overflow-hidden">
                             {isPlaying ? (
                                <div className="h-full bg-white/90 animate-[width_linear] w-full origin-left" style={{ animationDuration: `${duration}s` }}></div>
                             ) : (
                                <div className="h-full bg-transparent w-full"></div>
                             )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-teal-100 font-medium">
                            <span>{isPlaying ? 'Playing...' : 'Voice Note'}</span>
                            <span>{duration > 0 ? `${Math.floor(duration)}s` : '...'}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-teal-100 text-xs italic">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span>Recording audio...</span>
                </div>
            )}
            </div>
        </div>
        
        {/* Transcript (Subtitles style) */}
        <div className="ml-10 mt-1">
            <p className="text-gray-500 text-xs italic bg-white/50 px-2 py-1 rounded inline-block">
                "{message.text}"
            </p>
            <span className="text-[10px] text-gray-400 ml-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;