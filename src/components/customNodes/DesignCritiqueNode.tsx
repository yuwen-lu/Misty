import React from 'react';
import { Handle, Position } from 'reactflow';

interface DesignCritiqueNodeProps {
  id: string;
  data: {
    critique: string;
    persona?: string;
    websiteUrl?: string;
    timestamp?: Date;
  };
}

const DesignCritiqueNode: React.FC<DesignCritiqueNodeProps> = ({ id, data }) => {
  const { critique, persona, websiteUrl, timestamp } = data;
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Generate dynamic positioning based on node ID to avoid overlapping
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };
  
  const offsetX = (hashCode(id) % 5) * 20 - 40; // Range: -40 to 40
  const offsetY = (hashCode(id + 'y') % 5) * 20 - 40 + 100; // Range: 60 to 140 (lower than notes)

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border-2 border-blue-200 min-w-80 max-w-xl"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        width: '448px', // 320px (min-w-80) * 1.4 = 448px
      }}
    >
      {/* Connection handle from left side */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#3b82f6',
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-semibold text-blue-800 text-md flex items-center">
              <span className="mr-2">🎨</span>
              Design Critique
            </h3>
            {persona && (
              <p className="text-md text-blue-600 mt-2 font-medium">
                From {persona}&apos;s Perspective
              </p>
            )}
          </div>
          {timestamp && (
            <div className="text-md text-blue-600">
              {formatTimestamp(timestamp)}
            </div>
          )}
        </div>
        {/* {websiteUrl && (
          <p className="text-md text-blue-600 mt-1 break-all">
            {new URL(websiteUrl).hostname}
          </p>
        )} */}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {critique ? (
          <div className="text-md text-gray-600 whitespace-pre-wrap">
            {critique}
          </div>
        ) : (
          <p className="text-md text-gray-400">Loading critique...</p>
        )}
      </div>
    </div>
  );
};

export default DesignCritiqueNode;