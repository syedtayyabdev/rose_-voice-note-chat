import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSave = () => {
    if (inputKey.trim()) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-pink-100 animate-[fadeIn_0.3s_ease-out]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-pink-500 text-2xl">
            🔑
          </div>
          <h2 className="text-xl font-bold text-gray-800">Setup Rose 💖</h2>
          <p className="text-sm text-gray-500 mt-2">
            To chat with Rose, you need a free Google Gemini API Key.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Paste API Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!inputKey}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold rounded-xl py-3 transition-all shadow-lg shadow-pink-200"
          >
            Start Chatting
          </button>

          <p className="text-xs text-center text-gray-400">
            Don't have a key?{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pink-600 hover:underline"
            >
              Get one here for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;