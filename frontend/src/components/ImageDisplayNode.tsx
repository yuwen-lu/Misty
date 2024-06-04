import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

const ImageDisplayNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="image-display-node">
      <img src={data.image} alt="Uploaded" style={{ maxWidth: '20vw', maxHeight: '30vh' }} />
      <Handle type="target" position={Position.Top} />
      {/* <Handle type="dissect" position={Position.Right} /> */}
    </div>
  );
};

export default ImageDisplayNode;
