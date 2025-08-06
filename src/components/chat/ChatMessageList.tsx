import React from 'react';
import { ChatMessage, ChatMessageRole } from './ChatMessage';
import { ToolCall } from './ToolCallWidget';

export interface Message {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

interface ChatMessageListProps {
  messages: Message[];
  onAddToInput?: (text: string) => void;
  onNavigateToCanvas?: (x: number, y: number) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  onAddToInput,
  onNavigateToCanvas,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-4 w-full pt-1 px-2">
      {messages.map((message, index) => (
        <div key={message.id || index}>
          <ChatMessage
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            onAddToInput={onAddToInput}
            toolCalls={message.toolCalls}
            onNavigateToCanvas={onNavigateToCanvas}
          />
          
          {index !== messages.length - 1 && (
            <div className="border-b border-gray-100 my-2" />
          )}
        </div>
      ))}
    </div>
  );
};