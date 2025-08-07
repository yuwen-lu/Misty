import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
  sendChatMessage: (message: string) => void;
  registerChatHandler: (handler: (message: string) => void) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatHandler, setChatHandler] = useState<((message: string) => void) | null>(null);

  const sendChatMessage = (message: string) => {
    if (chatHandler) {
      chatHandler(message);
    }
  };

  const registerChatHandler = (handler: (message: string) => void) => {
    setChatHandler(() => handler);
  };

  return (
    <ChatContext.Provider value={{ sendChatMessage, registerChatHandler }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};