import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, CircleStop, Paperclip, Mic, ChevronDown } from 'lucide-react';

export enum Models {
  claudeSonnet4 = 'claude-sonnet-4-20250514',
  claudeOpus4 = 'claude-opus-4-20250514',
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  model: Models;
  onModelChange: (model: Models) => void;
  animateSendButton?: boolean;
  showDiamondCursor?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  model,
  onModelChange,
  animateSendButton = false,
  showDiamondCursor = false,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const models = [
    { id: Models.claudeSonnet4, name: 'Claude Sonnet 4', description: 'Great performance and speed' },
    { id: Models.claudeOpus4, name: 'Claude Opus 4', description: 'Most capable, but slower and more expensive' }
  ];

  const currentModel = models.find(m => m.id === model) || models[0];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSubmit = () => {
    if (isLoading) return;
    onSubmit();
  };

  return (
    <div className="sticky bottom-0 w-full pt-4 flex flex-col gap-4">
      <div className="w-full flex flex-col gap-1 bg-gray-50 p-2.5 pl-4 rounded-xl border shadow-sm">
        <div className="flex gap-2 items-end">
          {/* Main input textarea with diamond cursor overlay */}
          <div className="relative w-full">
            <textarea
              ref={inputRef}
              placeholder="Send a message."
              className="min-h-[40px] max-h-32 overflow-auto w-full bg-transparent border-none resize-none focus:outline-none text-sm"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {/* Diamond cursor overlay */}
            {showDiamondCursor && (
              <div className="absolute top-0 left-0 pointer-events-none text-sm leading-[40px] pl-0">
                <span className="invisible">{input}</span>
                <span className="animate-pulse text-green-500">💎</span>
              </div>
            )}
          </div>

          {/* File upload button */}
          {/* <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
            <Paperclip size={16} />
          </button> */}

          {/* Voice recording button */}
          {/* <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
            <Mic size={16} />
          </button> */}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() && !isLoading}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              animateSendButton 
                ? 'bg-green-500 hover:bg-green-600 text-white animate-bounce-scale' 
                : 'bg-black hover:bg-gray-800 text-white disabled:bg-gray-300'
            }`}
          >
            {isLoading ? (
              <CircleStop size={16} />
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </div>

        {/* Model selection dropdown */}
        <div className="flex justify-start relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded hover:bg-gray-100"
          >
            <span>{currentModel.name}</span>
            <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-64 z-10">
              {models.map((modelOption) => (
                <button
                  key={modelOption.id}
                  onClick={() => {
                    onModelChange(modelOption.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    model === modelOption.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm">{modelOption.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{modelOption.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};