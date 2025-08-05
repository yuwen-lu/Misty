import React from 'react';
import { ChatMessage, ChatMessageRole, WebPreviewNodeData, FontNodeData } from './ChatMessage';

export interface Message {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: Date;
}

interface ChatMessageListProps {
  messages: Message[];
  onAddToInput?: (text: string) => void;
  onCreateWebPreviewNode?: (webPreviewNodes: WebPreviewNodeData[]) => void;
  onCreateFontNode?: (fontNodes: FontNodeData[]) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  onAddToInput,
  onCreateWebPreviewNode,
  onCreateFontNode,
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
            onCreateWebPreviewNode={onCreateWebPreviewNode}
            onCreateFontNode={onCreateFontNode}
          />
          
          {index !== messages.length - 1 && (
            <div className="border-b border-gray-100 my-2" />
          )}
        </div>
      ))}
    </div>
  );
};