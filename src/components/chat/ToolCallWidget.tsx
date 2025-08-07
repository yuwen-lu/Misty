import React from 'react';
import { 
  Layout, 
  Palette, 
  Type, 
  MousePointer,
  Image,
  Code,
  Settings,
  Gem
} from 'lucide-react';

export interface ToolCall {
  id: string;
  toolName: string;
  description: string;
  nodesCreated?: Array<{
    id: string;
    position: { x: number; y: number };
  }>;
  isClickable: boolean;
}

export interface ConsolidatedToolCall {
  id: string;
  toolName: string;
  description: string;
  count: number;
  allNodesCreated: Array<{
    id: string;
    position: { x: number; y: number };
  }>;
  isClickable: boolean;
}

interface ToolCallWidgetProps {
  toolCall: ToolCall;
  onNavigate?: (x: number, y: number) => void;
}

interface ConsolidatedToolCallWidgetProps {
  toolCalls: ToolCall[];
  onNavigate?: (x: number, y: number) => void;
}

// Function to consolidate multiple tool calls of the same type
export const consolidateToolCalls = (toolCalls: ToolCall[]): ConsolidatedToolCall[] => {
  const grouped: Record<string, ToolCall[]> = {};
  
  // Group by tool name
  toolCalls.forEach(toolCall => {
    if (!grouped[toolCall.toolName]) {
      grouped[toolCall.toolName] = [];
    }
    grouped[toolCall.toolName].push(toolCall);
  });
  
  // Convert groups to consolidated tool calls
  return Object.entries(grouped).map(([toolName, calls]) => {
    const allNodes = calls.flatMap(call => call.nodesCreated || []);
    const totalCount = calls.reduce((sum, call) => {
      // Extract count from description or default to 1
      const match = call.description.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 1);
    }, 0);
    
    return {
      id: `consolidated-${toolName}-${Date.now()}`,
      toolName,
      description: `${totalCount} ${getToolDisplayName(toolName).toLowerCase()}${totalCount > 1 ? 's' : ''} created`,
      count: totalCount,
      allNodesCreated: allNodes,
      isClickable: allNodes.length > 0
    };
  });
};

const getToolIcon = (toolName: string) => {
  const iconProps = { size: 24, className: "text-gray-600" };
  
  switch (toolName) {
    case 'createWebPreviewNode':
      return <Layout {...iconProps} />;
    case 'createFontNode':
    case 'createTextInstructionNode':
      return <Type {...iconProps} />;
    case 'createDesignNotesNode':
      return <Palette {...iconProps} />;
    case 'createDesignCritiqueNode':
      return <MousePointer {...iconProps} />;
    case 'imageUpload':
      return <Image {...iconProps} />;
    case 'codeRender':
      return <Code {...iconProps} />;
    case 'deductDiamonds':
      return <Gem {...iconProps} />;
    default:
      return <Settings {...iconProps} />;
  }
};

const getToolDisplayName = (toolName: string): string => {
  const displayNameMap: Record<string, string> = {
    createWebPreviewNode: 'Web Preview',
    createFontNode: 'Font Selection',
    createTextInstructionNode: 'Design Notes',
    createDesignNotesNode: 'User Feedback',
    createDesignCritiqueNode: 'Design Critique',
    imageUpload: 'Image Upload',
    codeRender: 'Code Generation',
  };

  return displayNameMap[toolName] || toolName;
};

export const ToolCallWidget: React.FC<ToolCallWidgetProps> = ({
  toolCall,
  onNavigate
}) => {
  const handleClick = () => {
    if (toolCall.isClickable && toolCall.nodesCreated?.length && onNavigate) {
      // Calculate center point of all created nodes
      const nodes = toolCall.nodesCreated;
      const avgX = nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
      const avgY = nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;
      onNavigate(avgX, avgY);
    }
  };

  const displayName = getToolDisplayName(toolCall.toolName);

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-3 mb-2 rounded-lg border bg-white
        transition-all duration-200 hover:shadow-sm
        ${toolCall.isClickable 
          ? 'cursor-pointer hover:bg-gray-50 border-gray-200' 
          : 'border-gray-100'
        }
      `}
      onClick={handleClick}
      role={toolCall.isClickable ? 'button' : undefined}
      tabIndex={toolCall.isClickable ? 0 : undefined}
      onKeyDown={toolCall.isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {getToolIcon(toolCall.toolName)}
      
      <div className="flex flex-col gap-0.5 ml-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </span>
        </div>
        
        <span className="text-xs text-gray-500 truncate max-w-[200px]">
          {toolCall.description}
        </span>
      </div>
    </div>
  );
};

// Consolidated widget for multiple tool calls
export const ConsolidatedToolCallWidget: React.FC<ConsolidatedToolCallWidgetProps> = ({
  toolCalls,
  onNavigate
}) => {
  if (toolCalls.length === 0) return null;
  
  const consolidated = consolidateToolCalls(toolCalls);
  
  return (
    <>
      {consolidated.map((consolidatedCall) => {
        const handleClick = () => {
          if (consolidatedCall.isClickable && consolidatedCall.allNodesCreated.length && onNavigate) {
            // Calculate center point of all created nodes
            const nodes = consolidatedCall.allNodesCreated;
            const avgX = nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
            const avgY = nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;
            onNavigate(avgX, avgY);
          }
        };

        const displayName = getToolDisplayName(consolidatedCall.toolName);

        return (
          <div
            key={consolidatedCall.id}
            className={`
              inline-flex items-center gap-2 px-3 py-3 mb-2 rounded-lg border bg-white
              transition-all duration-200 hover:shadow-sm
              ${consolidatedCall.isClickable 
                ? 'cursor-pointer hover:bg-gray-50 border-gray-200' 
                : 'border-gray-100'
              }
            `}
            onClick={handleClick}
            role={consolidatedCall.isClickable ? 'button' : undefined}
            tabIndex={consolidatedCall.isClickable ? 0 : undefined}
            onKeyDown={consolidatedCall.isClickable ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            } : undefined}
          >
            {getToolIcon(consolidatedCall.toolName)}
            
            <div className="flex flex-col gap-0.5 ml-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </span>
                {consolidatedCall.count > 1 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {consolidatedCall.count}
                  </span>
                )}
              </div>
              
              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                {consolidatedCall.description}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};