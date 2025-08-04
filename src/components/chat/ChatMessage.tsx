import React from 'react';
import { User, Bot } from 'lucide-react';

export type ChatMessageRole = 'user' | 'assistant';

interface ChatMessageProps {
  role: ChatMessageRole;
  content: string;
  timestamp?: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  role, 
  content, 
  timestamp 
}) => {
  return (
    <div className="flex items-start gap-2 px-2 py-2 rounded-md bg-white">
      <div
        className={`border rounded-md p-1 ${
          role === 'user' ? 'bg-white' : 'bg-black border-black'
        }`}
      >
        {role === 'user' ? (
          <User size={20} />
        ) : (
          <Bot size={20} color="white" />
        )}
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm m-0">{content}</p>
        </div>
        
        {timestamp && (
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};