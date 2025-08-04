import React, { RefObject } from 'react';
import { ChatMessage, ChatMessageRole } from './ChatMessage';

export interface Message {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: Date;
}

interface ChatMessageListProps {
  messages: Message[];
  containerRef: RefObject<HTMLDivElement>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  containerRef,
}) => {
  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col gap-4 w-full pt-1 px-2"
    >
      {messages.map((message, index) => (
        <div key={message.id || index}>
          <ChatMessage
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
          
          {index !== messages.length - 1 && (
            <div className="border-b border-gray-100 my-2" />
          )}
        </div>
      ))}
    </div>
  );
};