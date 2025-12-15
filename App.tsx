import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from './components/ChatBubble';
import InputArea from './components/InputArea';
import ApiKeyModal from './components/ApiKeyModal';
import { Message, RoseState } from './types';
import { generateRoseText, generateRoseSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roseState, setRoseState] = useState<RoseState>(RoseState.IDLE);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  
  // Audio Context is persistent
  const audioContextRef = useRef<AudioContext | null>(null);
  // Chat history for context
  const historyRef = useRef<{ role: 'user' | 'model', parts: [{ text: string }] }[]>([]);
  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AudioContext and load API key
  useEffect(() => {
    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000 
            });
        } else if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    // Check local storage for key
    const storedKey = localStorage.getItem('rose_gemini_key');
    if (storedKey) {
      setApiKey(storedKey);
    }

    return () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  // Handle Initial Greeting
  useEffect(() => {
    if (!apiKey || messages.length > 0) return;

    const initialGreeting = async () => {
        setRoseState(RoseState.THINKING);
        // Small delay to simulate connection
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const text = "Hi baby! Main online aa gayi. Miss kiya mujhe?";
        
        const msgId = Date.now().toString();
        const newMessage: Message = {
            id: msgId,
            sender: 'rose',
            text: text,
            timestamp: new Date(),
            isAudio: false,
            autoPlay: true // Auto play the greeting!
        };
        
        setMessages([newMessage]);
        historyRef.current.push({ role: 'model', parts: [{ text }] });
        
        setRoseState(RoseState.RECORDING);
        const audioData = await generateRoseSpeech(text, apiKey);
        
        if (audioData) {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isAudio: true, audioData } : m));
        }
        setRoseState(RoseState.IDLE);
    };

    initialGreeting();
  }, [apiKey]); 

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, roseState, currentlyPlayingId]);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('rose_gemini_key', key);
    
    // Attempt to wake up audio context immediately on interaction
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  };

  const handleRemoveKey = () => {
    setApiKey('');
    localStorage.removeItem('rose_gemini_key');
    setMessages([]);
    historyRef.current = [];
  };

  const handleSendMessage = async (text: string) => {
    if (!apiKey) return;

    // Ensure audio context is ready (mobile browsers need this on touch)
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
      isAudio: false
    };
    
    setMessages(prev => [...prev, userMsg]);
    historyRef.current.push({ role: 'user', parts: [{ text }] });
    
    setRoseState(RoseState.THINKING);

    // 2. Generate Rose Text
    const roseText = await generateRoseText(historyRef.current, text, apiKey);
    
    // 3. Add Rose Placeholder
    const roseMsgId = (Date.now() + 1).toString();
    const roseMsgPlaceholder: Message = {
        id: roseMsgId,
        sender: 'rose',
        text: roseText,
        timestamp: new Date(),
        isAudio: false,
        autoPlay: true // Auto play response
    };
    
    setMessages(prev => [...prev, roseMsgPlaceholder]);
    historyRef.current.push({ role: 'model', parts: [{ text: roseText }] });
    
    // 4. Generate Rose Audio
    setRoseState(RoseState.RECORDING);
    const audioData = await generateRoseSpeech(roseText, apiKey);
    
    if (audioData) {
        setMessages(prev => prev.map(m => m.id === roseMsgId ? { ...m, isAudio: true, audioData } : m));
    }
    
    setRoseState(RoseState.IDLE);
  };

  const getStatusText = () => {
    if (currentlyPlayingId) return "Speaking...";
    switch(roseState) {
        case RoseState.THINKING: return "Typing...";
        case RoseState.RECORDING: return "Recording voice note...";
        case RoseState.SPEAKING: return "Speaking...";
        default: return "Online";
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto bg-white shadow-2xl overflow-hidden sm:rounded-xl sm:my-5 sm:h-[90vh] sm:border sm:border-pink-100">
      
      {!apiKey && <ApiKeyModal onSave={handleSaveKey} />}

      {/* Header */}
      <header className="bg-pink-600 text-white p-4 flex items-center justify-between shadow-md z-10 transition-colors duration-300" 
              style={{ backgroundColor: currentlyPlayingId ? '#db2777' : '' }}>
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-xl border-2 transition-all duration-300 ${currentlyPlayingId ? 'border-teal-400 text-teal-600 scale-105' : 'border-pink-200 text-pink-600'}`}>
                    R
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${currentlyPlayingId ? 'bg-teal-400 animate-ping' : (roseState === RoseState.IDLE ? 'bg-green-400' : 'bg-yellow-400')}`}></div>
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">Rose 💖</h1>
                <p className="text-xs text-pink-100 font-medium opacity-90 flex items-center gap-1">
                   {currentlyPlayingId && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                   {getStatusText()}
                </p>
            </div>
        </div>
        {apiKey && (
            <button 
                onClick={handleRemoveKey}
                className="text-xs bg-black/20 hover:bg-black/30 text-white px-2 py-1 rounded transition-colors"
                title="Reset API Key"
            >
                Reset
            </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 bg-[#fdf2f8] scroll-smooth">
        <div className="space-y-6">
            <div className="text-center text-xs text-gray-400 my-4">
                <span className="bg-white/60 px-3 py-1 rounded-full">Today</span>
            </div>
            
            {messages.map((msg) => (
                <ChatBubble 
                    key={msg.id} 
                    message={msg} 
                    audioContext={audioContextRef.current}
                    onPlayStart={(id) => {
                        setCurrentlyPlayingId(id);
                        setRoseState(RoseState.SPEAKING);
                    }}
                    onPlayEnd={() => {
                        setCurrentlyPlayingId(null);
                        setRoseState(RoseState.IDLE);
                    }}
                    currentlyPlayingId={currentlyPlayingId}
                />
            ))}
            
            {roseState === RoseState.THINKING && (
                <div className="flex items-center gap-2 text-gray-400 text-xs ml-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea 
        onSend={handleSendMessage} 
        disabled={roseState !== RoseState.IDLE || !apiKey}
      />
    </div>
  );
};

export default App;