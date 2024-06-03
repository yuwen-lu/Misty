import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';

const ImageDisplayNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="image-display-node">
      <img src={data.image} alt="Uploaded" style={{ width: '100%', height: '100%' }} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
};

export default ImageDisplayNode;
