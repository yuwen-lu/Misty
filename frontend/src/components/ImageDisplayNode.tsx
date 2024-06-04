import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

const ImageDisplayNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="image-display-node p-5 bg-white rounded-lg border-2 border-stone-400">
      <img src={data.image} alt="Uploaded" style={{ maxWidth: '30vw', maxHeight: '40vh' }} />
      {/* <Handle type="target" position={Position.Top} /> */}
      {/* <Handle type="dissect" position={Position.Right} /> */}
    </div>
  );
};

export default ImageDisplayNode;
