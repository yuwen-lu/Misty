import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DissectHandle } from './DissectHandle';
import 'reactflow/dist/style.css';
import '../index.css';


const ImageDisplayNode: React.FC<NodeProps> = ({ data }) => {


  const [response, setResponse] = useState<string>('');

  const dissectImage = (base64image: string) => {
    
    // construct message data using the image
    const messageData = {
      message: "Describe this image using one sentence.",
      image: base64image
    };

    fetch('http://127.0.0.1:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    })
      .then(res => res.json())
      .then(data => setResponse(data.response))
      .catch(error => console.error('Error:', error));
  }

  return (
    <div className="image-display-node flex flex-col items-center p-5 bg-white rounded-lg border-2 border-stone-400">
      <img className='rounded-md' src={data.image} alt="Uploaded" style={{ maxWidth: '30vw', maxHeight: '40vh' }} />
      {/* <DissectHandle position={Position.Right} source='' ></DissectHandle> */}
      <button
        className='rounded-full bottom- mt-6 px-3 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-700 focus:outline-none'
        onClick={() => dissectImage(data.image)}
      >
        Dissect
      </button>
      <h1 className='font-bold m-2'>OpenAI Response</h1>
      <p>{response}</p>
    </div>
  );
};

export default ImageDisplayNode;
