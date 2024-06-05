import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

const formatContent = (text: string) => {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph + "\n\n"}</p>`)
    .join('')
}

const ImageDisplayNode: React.FC<NodeProps> = ({ data }) => {


  const [response, setResponse] = useState<string>('');
  const [canvasActivated, setCanvasActivated] = useState<Boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasButtonRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const dissectImage = (base64image: string) => {

    console.log("length of displayed source base64: ", data.image.length);
    console.log("length of base64: ", base64image.length);
    // construct message data using the image
    const messageData = {
      message: "I am a designer working on my own design, but I want to borrow ideas from this example. What are some noticable, good design decisions to refer to on this website UI? Be specific and focus on things including the layout, interaction, and visual styles.",
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
      .then(data => {
        setResponse(data.response);
        const targetDiv = document.getElementById("openai-response-div");
        if (targetDiv) {
          console.log("raw data: \n" + data.response);
          console.log("formatted data: \n" + formatContent(data.response));
          targetDiv.innerHTML = formatContent(data.response);
        } else {
          console.log("cannot find target div for response result!");
        }
      })
      .catch(error => console.error('Error:', error));
  }



  const toggleCanvas = () => {

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const canvasButton = canvasButtonRef.current;

    if (!canvasActivated) {
      if (img && canvas && canvasButton) {

        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        canvas.style.width = `${img.clientWidth}px`;
        canvas.style.height = `${img.clientHeight}px`;

        // set up canvas
        const context = canvas.getContext('2d');
        if (!context) return;

        // test draw something
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // set button text
        canvasButton.innerText = "Done"
        setCanvasActivated(true);
      }
    } else {
      if (img && canvas && canvasButton) {

        // clear canvas
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }

        canvasButton.innerText = "Scribble Elements"
        setCanvasActivated(false);
      }
    }
  }


  return (
    <div className="image-display-node flex flex-col items-center p-5 bg-white rounded-lg border-2 border-stone-400">

      <div className='image-display-section relative'>
        <img
          ref={imgRef}
          className='rounded-md cursor-wait'
          src={data.image}
          alt="Uploaded"
          style={{ maxWidth: '30vw', maxHeight: '40vh' }}
        />
        <canvas ref={canvasRef} className='absolute top-0 left-0 z-10'></canvas>
      </div>

      <button
        className='rounded-full bottom- mt-6 px-3 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-700 focus:outline-none'
        ref={canvasButtonRef}
        // onClick={() => dissectImage(data.image)}
        onClick={toggleCanvas}
      >
        Scribble Elements
      </button>
    </div>
  );
};

export default ImageDisplayNode;
