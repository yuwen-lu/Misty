import React from 'react';
import { Handle, Position } from 'reactflow';

interface DesignNotesNodeProps {
  id: string;
  data: {
    feedback: {
      notes: string;
    };
    websiteUrl?: string;
    timestamp?: Date;
  };
}

const DesignNotesNode: React.FC<DesignNotesNodeProps> = ({ id, data }) => {
  const { feedback, websiteUrl, timestamp } = data;
  
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
  const offsetY = (hashCode(id + 'y') % 5) * 20 - 40; // Range: -40 to 40
  
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

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border-2 border-green-200 min-w-80 max-w-md"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      {/* Connection handle from left side */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#10b981',
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      
      {/* Header */}
      <div className="bg-green-50 px-4 py-3 border-b border-green-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-green-800 text-sm flex items-center">
            <span className="mr-2">📝</span>
            Design Notes
          </h3>
          {timestamp && (
            <div className="text-xs text-green-600">
              {formatTimestamp(timestamp)}
            </div>
          )}
        </div>
        {websiteUrl && (
          <p className="text-xs text-green-600 mt-1 break-all">
            {new URL(websiteUrl).hostname}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {feedback.notes ? (
          <p className="text-sm text-gray-600">{feedback.notes}</p>
        ) : (
          <p className="text-sm text-gray-400">No feedback provided</p>
        )}
      </div>

      {/* Footer with earned gems indicator */}
      {/* <div className="bg-gray-50 px-4 py-2 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <span className="mr-1">Earned</span>
          <span className="text-yellow-600 font-semibold">2 💎</span>
          <span className="ml-1">for feedback</span>
        </div>
      </div> */}
    </div>
  );
};

export default DesignNotesNode;