import React, { useState } from 'react';
import { Paperclip, Mic, ArrowUp, ChevronDown } from 'lucide-react';

interface InitialChatDialogProps {
  onStartChat: (message: string, model: 'claude-sonnet' | 'claude-opus') => void;
  onClose: () => void;
}

const InitialChatDialog: React.FC<InitialChatDialogProps> = ({ onStartChat, onClose }) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'claude-sonnet' | 'claude-opus'>('claude-sonnet');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onStartChat(message, selectedModel);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const models = [
    { id: 'claude-sonnet', name: 'Claude Sonnet', description: 'great performance and speed' },
    { id: 'claude-opus', name: 'Claude Opus', description: 'most capable, but slower and more expensive' }
  ] as const;

  const suggestedPrompts = [
    "Create a portfolio website for a photographer",
    "Help me design a modern e-commerce site for clothing",
    "I need a landing page for a tech startup",
    "Create a blog layout for food recipes"
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-gray-100 rounded-3xl p-4 shadow-lg">
        <div className="flex items-end gap-3">
          {/* Main input area */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What do you want to design today?"
              className="w-full resize-none border-none outline-none text-gray-700 placeholder-gray-400 bg-transparent"
              rows={1}
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Mic size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
        
        {/* Model selector */}
        <div className="mt-3 flex items-center justify-start relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-1 rounded-lg hover:bg-gray-50"
          >
            <span>{models.find(m => m.id === selectedModel)?.name}</span>
            <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-64 z-10">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedModel === model.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitialChatDialog;