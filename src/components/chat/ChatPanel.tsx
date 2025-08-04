import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { ChatInput, Models } from './ChatInput';
import { ChatMessageList, Message } from './ChatMessageList';

interface ChatPanelProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  initialMessage?: string;
  selectedModel?: Models;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isMinimized,
  onToggleMinimize,
  initialMessage,
  selectedModel = Models.claudeSonnet4
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<Models>(selectedModel);
  const messagesRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialMessage = useRef(false);

  const scrollToBottom = () => {
    messagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial message when component mounts
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialMessage,
        timestamp: new Date(),
      };

      setMessages([userMessage]);
      setIsLoading(true);

      // Send the initial message to the API
      fetch('/api/design-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: initialMessage,
          model: currentModel === Models.claudeOpus4 ? 'claude-opus' : 'claude-sonnet',
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        const readStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            accumulatedContent += chunk;

            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: accumulatedContent }
                : msg
            ));
          }
        };

        return readStream();
      })
      .catch(error => {
        console.error('Error sending initial message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [initialMessage, currentModel]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/design-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          model: currentModel === Models.claudeOpus4 ? 'claude-opus' : 'claude-sonnet',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: accumulatedContent }
            : msg
        ));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
        >
          <Maximize2 size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-4 bottom-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200">
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          messages={messages}
          containerRef={messagesRef}
        />
        
        {isLoading && (
          <div className="flex justify-start px-4 pb-4">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          model={currentModel}
          onModelChange={setCurrentModel}
        />
      </div>
    </div>
  );
};