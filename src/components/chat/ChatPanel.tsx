import React, { useState, useEffect, useRef, memo } from 'react';
import { Minimize2, MessageCircle } from 'lucide-react';
import { ChatInput, Models } from './ChatInput';
import { ChatMessageList, Message } from './ChatMessageList';
import { WebPreviewNodeData, FontNodeData, TextInstructionNodeData } from './ChatMessage';
import { ToolCall } from './ToolCallWidget';
import { useCoins } from '../../contexts/CoinContext';
import { storeUserIntent, compileUserInteractionContext } from '../../utils/userInteractionStorage';

interface ChatPanelProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  initialMessage?: string;
  selectedModel?: Models;
  onCreateWebPreviewNode?: (webPreviewNodes: WebPreviewNodeData[], onFirstNodeCreated?: (x: number, y: number) => void, nodeIds?: string[]) => void;
  onCreateFontNode?: (fontNodes: FontNodeData[], onFirstNodeCreated?: (x: number, y: number) => void) => void;
  onCreateTextInstructionNode?: (textInstructionNodes: TextInstructionNodeData[]) => void;
  onCreateDesignGenerationNode?: (onNodeCreated?: (x: number, y: number) => void, designContext?: string) => string;
  onCenterCanvas?: (x: number, y: number) => void;
}

const ChatPanelComponent: React.FC<ChatPanelProps> = ({
  isMinimized,
  onToggleMinimize,
  initialMessage,
  selectedModel = Models.claudeSonnet4,
  onCreateWebPreviewNode,
  onCreateFontNode,
  onCreateTextInstructionNode,
  onCreateDesignGenerationNode,
  onCenterCanvas
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<Models>(selectedModel);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialMessage = useRef(false);
  const { coins, spendCoins, isLoaded } = useCoins();
  
  // Function to parse and execute tool calls from API response
  const executeToolCalls = async (content: string): Promise<ToolCall[]> => {
    const jsonBlocks = content.match(/```json\n([\s\S]*?)```/g);
    if (!jsonBlocks) return [];
    
    // Collect all tools by type
    const webPreviewNodes: any[] = [];
    const fontNodes: any[] = [];
    const textInstructionNodes: any[] = [];
    const toolCalls: ToolCall[] = [];
    let totalDiamondsToDeduct = 0;
    
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
        } else if (parsed.tool === 'createDesignGenerationNode' && parsed.parameters) {
          // Create design generation node with design context
          if (onCreateDesignGenerationNode) {
            const nodeId = onCreateDesignGenerationNode(
              (x, y) => {
                if (onCenterCanvas) onCenterCanvas(x, y);
              },
              parsed.parameters.designContext
            );
            
            toolCalls.push({
              id: `design-generation-${Date.now()}`,
              toolName: 'createDesignGenerationNode',
              description: 'Design generation canvas created',
              nodesCreated: [{ id: nodeId, position: { x: 400, y: 200 } }],
              isClickable: true
            });
          }
        } else if (parsed.tool === 'storeUserIntent' && parsed.parameters) {
          storeUserIntent(parsed.parameters);
          toolCalls.push({
            id: `store-intent-${Date.now()}`,
            toolName: 'storeUserIntent',
            description: 'User design requirements stored',
            nodesCreated: [],
            isClickable: false
          });
        } else if (parsed.tool === 'deductDiamonds' && parsed.parameters) {
          const amount = parsed.parameters.amount || 0;
          totalDiamondsToDeduct += amount;
          toolCalls.push({
            id: `deduct-diamonds-${Date.now()}`,
            toolName: 'deductDiamonds',
            description: `${amount} diamonds deducted: ${parsed.parameters.reason}`,
            nodesCreated: [],
            isClickable: false
          });
        }
      } catch (e) {
        console.warn('Failed to parse tool call:', e);
      }
    }
    
    // Track if this is the first tool creating nodes
    let hasHandledFirstNode = false;
    
    // Create callback for centering on first node
    const handleFirstNode = (x: number, y: number) => {
      if (!hasHandledFirstNode && onCenterCanvas) {
        hasHandledFirstNode = true;
        // Center with a slight delay to ensure node is rendered
        setTimeout(() => {
          onCenterCanvas(x, y);
        }, 200);
      }
    };
    
    // Execute tool functions with batched tools and track created nodes
    if (webPreviewNodes.length > 0 && onCreateWebPreviewNode) {
      console.log('Creating web preview nodes:', webPreviewNodes);
      // Generate node IDs here and pass them to the creation function
      const timestamp = Date.now();
      const nodeIds = webPreviewNodes.map((_, index) => `web-preview-${timestamp}-${index}`);
      
      // Create the tool call with predetermined node IDs
      let baseX = 2500, baseY = 200;
      const nodePositions = nodeIds.map((id, index) => ({
        id,
        position: { x: baseX + (index % 2) * 1980, y: baseY + Math.floor(index / 2) * 1200 }
      }));
      
      toolCalls.push({
        id: `web-preview-${timestamp}`,
        toolName: 'createWebPreviewNode',
        description: `${webPreviewNodes.length} website preview${webPreviewNodes.length > 1 ? 's' : ''} created`,
        nodesCreated: nodePositions,
        isClickable: true
      });
      
      onCreateWebPreviewNode(webPreviewNodes, handleFirstNode, nodeIds);
    }
    
    if (fontNodes.length > 0 && onCreateFontNode) {
      const fontInstructionNodeId = `font-instruction-${Date.now()}`;
      
      // Calculate approximate position to the right of web preview area
      const webPreviewAreaWidth = 600 + 2 * (1280 + 700); // Same calculation as in FlowComponent
      const fontNodeX = webPreviewAreaWidth + 200;
      
      toolCalls.push({
        id: `font-${Date.now()}`,
        toolName: 'createFontNode',
        description: `${fontNodes.length} font selection tool${fontNodes.length > 1 ? 's' : ''} created`,
        nodesCreated: [{
          id: fontInstructionNodeId,
          position: { x: fontNodeX, y: 200 } // Position to the right of web preview area
        }],
        isClickable: true
      });
      
      onCreateFontNode(fontNodes, handleFirstNode);
    }
    
    if (textInstructionNodes.length > 0 && onCreateTextInstructionNode && !hasHandledFirstNode) {
      toolCalls.push({
        id: `text-instruction-${Date.now()}`,
        toolName: 'createTextInstructionNode',
        description: `${textInstructionNodes.length} design instruction${textInstructionNodes.length > 1 ? 's' : ''} created`,
        nodesCreated: [],
        isClickable: false
      });
      
      onCreateTextInstructionNode(textInstructionNodes);
    }
    
    // Deduct diamonds if any were requested
    if (totalDiamondsToDeduct > 0) {
      const deducted = spendCoins(totalDiamondsToDeduct);
      if (!deducted) {
        console.warn('Insufficient diamonds to deduct:', totalDiamondsToDeduct);
      }
    }
    
    return toolCalls;
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (!isMinimized) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isMinimized]);

  // Handle initial message when component mounts
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessage.current && isLoaded) {
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
      const initialDesignContext = compileUserInteractionContext();
      const initialPayload = {
        message: initialMessage,
        model: currentModel === Models.claudeOpus4 ? 'claude-opus' : 'claude-sonnet',
        messages: [],
        diamondCount: coins,
        designContext: initialDesignContext,
      };
      
      console.log('🔷 Sending initial message to design-chat API:', {
        message: initialMessage,
        diamondCount: coins,
        messagesLength: 0
      });
      
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
              const toolCalls = await executeToolCalls(accumulatedContent);
              // Update the message with tool calls
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: accumulatedContent, toolCalls }
                  : msg
              ));
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
  }, [initialMessage, currentModel, coins, isLoaded]);

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
      // Get fresh design context for each message
      const designContext = compileUserInteractionContext();
      
      const payload = {
        message: input,
        model: currentModel === Models.claudeOpus4 ? 'claude-opus' : 'claude-sonnet',
        messages: messages,
        diamondCount: coins,
        designContext: designContext,
      };
      
      console.log('🔷 Sending message to design-chat API:', {
        message: input,
        diamondCount: coins,
        messagesLength: messages.length
      });
      
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
          const toolCalls = await executeToolCalls(accumulatedContent);
          // Update the message with tool calls
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: accumulatedContent, toolCalls }
              : msg
          ));
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

  // State for send button animation
  const [animateSendButton, setAnimateSendButton] = useState(false);

  // Handle programmatic messages from diamond menu
  useEffect(() => {
    if (initialMessage && initialMessage.includes('__')) {
      // Extract the actual message without timestamp
      const actualMessage = initialMessage.split('__')[0];
      setInput(actualMessage);
      // Trigger send button animation
      setAnimateSendButton(true);
      setTimeout(() => setAnimateSendButton(false), 600);
    }
  }, [initialMessage]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 shadow-lg transition-colors"
        >
          <MessageCircle size={28} />
        </button>
      </div>
    );
  }

  return (
    <div className="chat-panel-fixed chat-panel-container right-4 top-4 bottom-4 w-96 bg-white border border-gray-300 rounded-3xl shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200">
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-gray-200 rounded-md"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto chat-message-container">
        <ChatMessageList
          messages={messages}
          onAddToInput={handleAddToInput}
          onNavigateToCanvas={onCenterCanvas}
        />
        
        {isLoading && (
          <div className="flex justify-start px-4 pb-4">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-xl">
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
          animateSendButton={animateSendButton}
        />
      </div>
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ChatPanelProps, nextProps: ChatPanelProps) => {
  // Only re-render if these critical props change
  return (
    prevProps.isMinimized === nextProps.isMinimized &&
    prevProps.initialMessage === nextProps.initialMessage &&
    prevProps.selectedModel === nextProps.selectedModel &&
    prevProps.onToggleMinimize === nextProps.onToggleMinimize
    // Ignore onCenterCanvas, onCreateWebPreviewNode, etc. as they change frequently
    // but don't affect the display when chat is just open
  );
};

export const ChatPanel = memo(ChatPanelComponent, arePropsEqual);