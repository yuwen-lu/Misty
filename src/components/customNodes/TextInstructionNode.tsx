import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LuInfo } from 'react-icons/lu';

const TextInstructionNode: React.FC<NodeProps> = React.memo(({ id, data }) => {
  const { title, instructions, icon } = data;

  return (
    <div 
      className="text-instruction-node flex flex-col px-5 py-4 text-blue-900 bg-blue-50 bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-blue-200 border-opacity-60 shadow-lg border-t-8 border-t-blue-600 transition-all duration-300 ease-in-out"
      style={{
        width: 'fit-content',
        minWidth: '320px',
        maxWidth: '400px'
      }}
    >
      
      <div className="flex items-center gap-2 font-bold text-blue-900 text-lg mb-3">
        {icon || <LuInfo size={20} />}
        {title || 'Instructions'}
      </div>

      <div className="flex-1">
        {Array.isArray(instructions) ? (
          <div className="space-y-2">
            {instructions.map((instruction, index) => (
              <div key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span>{instruction}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-blue-800 whitespace-pre-wrap">
            {instructions}
          </div>
        )}
      </div>

      <Handle
        className="bg-blue-600 opacity-50"
        style={{
          width: '20px',
          height: '60px',
          borderRadius: '5px',
          borderWidth: '2px',
          borderColor: 'white',
          borderStyle: 'solid',
          marginRight: '-5px',
        }}
        type="source"
        position={Position.Right}
        id="b"
        isConnectable={true}
      />
    </div>
  );
});

export default TextInstructionNode;