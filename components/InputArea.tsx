import React, { useState } from 'react';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-white px-4 py-3 border-t border-pink-100">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-lg mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Rose is recording..." : "Message likho..."}
          disabled={disabled}
          className="flex-1 bg-gray-50 border border-pink-200 text-gray-800 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all placeholder-gray-400 disabled:opacity-60 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-full p-3 shadow-lg transition-transform transform active:scale-95 disabled:scale-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 translate-y-px">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default InputArea;