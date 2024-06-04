import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DissectHandle } from './DissectHandle';
import 'reactflow/dist/style.css';
import '../index.css';


const ImageDisplayNode: React.FC<NodeProps> = ({ data }) => {

  const dissectImage = () => {
    console.log("Dissecting image");
    console.log("Target image: ", data.image);
  }

  return (
    <div className="image-display-node flex flex-col items-center p-5 bg-white rounded-lg border-2 border-stone-400">
      <img className='rounded-md' src={data.image} alt="Uploaded" style={{ maxWidth: '30vw', maxHeight: '40vh' }} />
      {/* <DissectHandle position={Position.Right} source='' ></DissectHandle> */}
      <button
        className='rounded-full bottom- mt-6 px-3 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-700 focus:outline-none'
        onClick={dissectImage}
      >
        Dissect
      </button>
    </div>
  );
};

export default ImageDisplayNode;
