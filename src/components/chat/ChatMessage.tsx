import React, { useMemo, useCallback } from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PotentialUsersChips } from './PotentialUsersChips';
import { ToolCallWidget, ToolCall } from './ToolCallWidget';

export type ChatMessageRole = 'user' | 'assistant';

export interface WebPreviewNodeData {
  tool: 'createWebPreviewNode';
  parameters: {
    url: string;
  };
}

export interface FontNodeData {
  tool: 'createFontNode';
  parameters: {
    previewText: string;
    category?: string;
    designContext?: string;
  };
}

export interface TextInstructionNodeData {
  tool: 'createTextInstructionNode';
  parameters: {
    title: string;
    instructions: string[] | string;
    designContext?: string;
  };
}

interface ChatMessageProps {
  role: ChatMessageRole;
  content: string;
  timestamp?: Date;
  onAddToInput?: (text: string) => void;
  toolCalls?: ToolCall[];
  onNavigateToCanvas?: (x: number, y: number) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  role, 
  content, 
  timestamp,
  onAddToInput,
  toolCalls,
  onNavigateToCanvas
}) => {
  // Parse content to extract and format JSON blocks and detect potentialUsers
  const { processedContent, potentialUsers } = useMemo(() => {
    let users: string[] | null = null;
    
    const processed = content.replace(/```json\n([\s\S]*?)```/g, (match, jsonContent) => {
      try {
        const parsed = JSON.parse(jsonContent);
        
        // Check if this JSON contains potentialUsers
        if (parsed.potentialUsers && Array.isArray(parsed.potentialUsers)) {
          users = parsed.potentialUsers;
          // Hide the JSON block since we'll show chips instead
          return '';
        }
        
        // Check if this JSON contains tool calls (hide since we show widgets instead)
        if (parsed.tool && typeof parsed.tool === 'string') {
          // This is a tool call JSON block, hide it
          return '';
        }
        
        // For all other JSON blocks, format them nicely
        return '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
      } catch (e) {
        // If parsing fails, return original
        return match;
      }
    });
    
    return { 
      processedContent: processed, 
      potentialUsers: users
    };
  }, [content]);
  
  const handleChipClick = useCallback((user: string) => {
    if (onAddToInput) {
      onAddToInput(user);
    }
  }, [onAddToInput]);

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
        <div className="prose prose-sm max-w-none text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              pre: ({ children }) => (
                <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto my-2 text-sm whitespace-pre-wrap">
                  {children}
                </pre>
              ),
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return inline ? (
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className={`${className} font-mono block whitespace-pre`} {...props}>
                    {children}
                  </code>
                );
              },
              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">{children}</blockquote>,
              h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
              a: ({ children, href }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              table: ({ children }) => <table className="border-collapse table-auto w-full my-2">{children}</table>,
              thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b">{children}</tr>,
              th: ({ children }) => <th className="border px-4 py-2 text-left font-medium">{children}</th>,
              td: ({ children }) => <td className="border px-4 py-2">{children}</td>,
              hr: () => <hr className="my-4 border-gray-300" />,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
        
        {potentialUsers && onAddToInput && (
          <PotentialUsersChips 
            users={potentialUsers} 
            onChipClick={handleChipClick}
          />
        )}
        
        {/* Tool Call Widgets */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {toolCalls.map((toolCall) => (
              <ToolCallWidget
                key={toolCall.id}
                toolCall={toolCall}
                onNavigate={onNavigateToCanvas}
              />
            ))}
          </div>
        )}
        
        {timestamp && (
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};