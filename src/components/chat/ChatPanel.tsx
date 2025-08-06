import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { ChatInput, Models } from './ChatInput';
import { ChatMessageList, Message } from './ChatMessageList';
import { WebPreviewNodeData, FontNodeData, TextInstructionNodeData } from './ChatMessage';

interface ChatPanelProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  initialMessage?: string;
  selectedModel?: Models;
  onCreateWebPreviewNode?: (webPreviewNodes: WebPreviewNodeData[]) => void;
  onCreateFontNode?: (fontNodes: FontNodeData[]) => void;
  onCreateTextInstructionNode?: (textInstructionNodes: TextInstructionNodeData[]) => void;
  onNewChatRequest?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isMinimized,
  onToggleMinimize,
  initialMessage,
  selectedModel = Models.claudeSonnet4,
  onCreateWebPreviewNode,
  onCreateFontNode,
  onCreateTextInstructionNode,
  onNewChatRequest
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<Models>(selectedModel);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialMessage = useRef(false);
  
  // Function to parse and execute tool calls from API response
  const executeToolCalls = async (content: string) => {
    const jsonBlocks = content.match(/```json\n([\s\S]*?)```/g);
    if (!jsonBlocks) return;
    
    // Collect all tools by type
    const webPreviewNodes: any[] = [];
    const fontNodes: any[] = [];
    const textInstructionNodes: any[] = [];
    
    for (const block of jsonBlocks) {
      try {
        const jsonContent = block.replace(/```json\n/, '').replace(/```$/, '');
        const parsed = JSON.parse(jsonContent);
        
        if (parsed.tool === 'createWebPreviewNode' && parsed.parameters) {
          webPreviewNodes.push(parsed);
        } else if (parsed.tool === 'createFontNode' && parsed.parameters) {
          fontNodes.push(parsed);
        } else if (parsed.tool === 'createTextInstructionNode' && parsed.parameters) {
          textInstructionNodes.push(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse tool call:', e);
      }
    }
    
    // Execute tool functions with batched tools
    if (webPreviewNodes.length > 0 && onCreateWebPreviewNode) {
      onCreateWebPreviewNode(webPreviewNodes);
    }
    if (fontNodes.length > 0 && onCreateFontNode) {
      onCreateFontNode(fontNodes);
    }
    if (textInstructionNodes.length > 0 && onCreateTextInstructionNode) {
      onCreateTextInstructionNode(textInstructionNodes);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
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

      // Send the initial message to API
      const initialPayload = {
        message: initialMessage,
        model: currentModel === Models.claudeOpus4 ? 'claude-opus' : 'claude-sonnet',
        messages: [],
      };
      
      fetch('/api/design-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialPayload),
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
            if (done) {
              // Execute any tool calls found in the complete response
              await executeToolCalls(accumulatedContent);
              break;
            }

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

    // Reset zoom tracker for new request
    if (onNewChatRequest) {
      onNewChatRequest();
    }

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
      const payload = {
        message: input,
        model: currentModel === Models.claudeOpus4 ? 'claude-opus' : 'claude-sonnet',
        messages: messages,
      };
      
      const response = await fetch('/api/design-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
        if (done) {
          // Execute any tool calls found in the complete response
          await executeToolCalls(accumulatedContent);
          break;
        }

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

  const handleAddToInput = (text: string) => {
    setInput(prev => prev ? `${prev}, ${text}` : text);
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
    <div className="chat-panel-fixed chat-panel-container right-4 top-4 bottom-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50">
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto chat-message-container">
        <ChatMessageList
          messages={messages}
          onAddToInput={handleAddToInput}
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
      <div className="px-4 pb-4 pt-2">
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