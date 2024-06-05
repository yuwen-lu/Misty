import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FaTrash, FaUndo, FaCheck } from 'react-icons/fa';
import 'reactflow/dist/style.css';
import '../index.css';

const formatContent = (text: string) => {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph + "\n\n"}</p>`)
    .join('')
}

const ImageDisplayNode: React.FC<NodeProps> = ({ id, data }) => {


  const [response, setResponse] = useState<string>('');
  const [canvasActivated, setCanvasActivated] = useState<Boolean>(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [paths, setPaths] = useState<{ x: number, y: number }[][]>([]); // record the paths of scribble
  const [boundingBoxes, setBoundingBoxes] = useState<{ x: number, y: number, width: number, height: number }[]>([]); // record bounding box to cut image
  const [subImageList, setSubImageList] = useState< string[] >([]);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasButtonRef = useRef<HTMLButtonElement>(null);
  const canvasClearButtonRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // get bounding box based on a scribble path, to cut the image
  const getBoundingBox = (path: { x: number, y: number }[]) => {
    if (path.length === 0) return null;

    let minX = path[0].x;
    let minY = path[0].y;
    let maxX = path[0].x;
    let maxY = path[0].y;

    path.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };
  
  useEffect(() => {
    const handleLoad = () => {
      if (imgRef.current && canvasRef.current) {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
      }
    };

    const imgElement = imgRef.current;
    if (imgElement) {
      if (imgElement.complete) {
        handleLoad();
      } else {
        imgElement.addEventListener('load', handleLoad);
        return () => imgElement.removeEventListener('load', handleLoad);
      }
    }
    
  }, []);

  // using useEffect to handle the draw operations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = 'rgba(177, 230, 103, 0.5)';
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.lineWidth = 10;

      paths.forEach((path) => {
        if (path.length < 2) return;
        context.beginPath();
        context.moveTo(path[0].x, path[0].y);

        for (let i = 1; i < path.length - 1; i++) {
          const midPoint = {
            x: (path[i].x + path[i + 1].x) / 2,
            y: (path[i].y + path[i + 1].y) / 2,
          };
          context.quadraticCurveTo(path[i].x, path[i].y, midPoint.x, midPoint.y);
        }

        context.lineTo(path[path.length - 1].x, path[path.length - 1].y);
        context.stroke();
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsDrawing(true);
      const { offsetX, offsetY } = e;
      setPaths((prevPaths) => [...prevPaths, [{ x: offsetX, y: offsetY }]]);
      e.stopPropagation(); // Prevent ReactFlow from handling this event
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;

      const { offsetX, offsetY } = e;
      setPaths((prevPaths) => {
        const newPaths = [...prevPaths];
        newPaths[newPaths.length - 1].push({ x: offsetX, y: offsetY });
        return newPaths;
      });
      draw();
      e.stopPropagation(); // Prevent ReactFlow from handling this event
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDrawing) {
        setIsDrawing(false);
        const newPaths = paths[paths.length - 1];
        const newBox = getBoundingBox(newPaths);

        if (newBox) {
          setBoundingBoxes((prevBoxes) => {
            const newBoxes = [...prevBoxes];
            newBoxes.push(newBox)
            return newBoxes;
          });
          // Extract sub-image
          // TODO this seems to sometimes get index out of bound error
          const imageData = context.getImageData(newBox.x, newBox.y, newBox.width, newBox.height);
          console.log('Sub-image data:', imageData);
          // convert Uint8ClampedArray to base64
          var decoder = new TextDecoder('utf8');
          // TODO there is issue here
          // var b64SubImage = btoa(decoder.decode(imageData.data));
          var b64SubImage = "";
          
        }
          // add the new sub-image data to the list
          setSubImageList((prevSubImageList) => {
            const newSubImageList = [...prevSubImageList];
            newSubImageList.push(b64SubImage);
            return newSubImageList;
          });
      }
      e.stopPropagation(); // Prevent ReactFlow from handling this event
    };

    const handleMouseLeave = (e: MouseEvent) => {
      setIsDrawing(false);
      e.stopPropagation(); // Prevent ReactFlow from handling this event
    };


    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDrawing, lastPoint]);

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

  // clear canvas
  const clearCanvas = () => {

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    // clear the paths as well
    setPaths([]);
  }

  const undoCanvas = () => {
    // TODO Implement this
  }


  return (
    <div className="image-display-node flex flex-col items-center p-5 bg-white rounded-lg border-2 border-stone-400">

      <div className='font-bold text-xl mb-5'>
        Scribble Elements
      </div>

      <div className='image-display-section relative'>
        <img
          ref={imgRef}
          className='rounded-md cursor-text'
          src={data.image}
          alt="Uploaded"
          style={{ maxWidth: '30vw', maxHeight: '40vh' }}
        />
        <canvas ref={canvasRef} className='absolute top-0 left-0 z-10'></canvas>
      </div>

      <div className='flex flex-row'>
        <button
          className={`flex items-center rounded-full mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${canvasActivated ? "bg-teal-500 hover:bg-teal-700" : "bg-stone-400"}`}
          onClick={clearCanvas}
          disabled={!canvasActivated}
        >
          <FaTrash />
          <span className='ml-2'>Clear</span>
        </button>
        <button
          className={`flex items-center rounded-full mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${canvasActivated ? "bg-teal-500 hover:bg-teal-700" : "bg-stone-400"}`}
          onClick={undoCanvas}
          disabled={!canvasActivated}
        >
          <FaUndo />
          <span className='ml-2'>Undo</span>
        </button>
        <button
          className='flex items-center rounded-full mt-6 mx-2 px-5 py-3 bg-teal-500 text-white font-semibold hover:bg-teal-700 focus:outline-none'
          ref={canvasButtonRef}
        // onClick={() => dissectImage(data.image)}
          onClick={() => {
            data.onSelectionConfirmed(id, subImageList);
            clearCanvas();
            setSubImageList([]);  // refresh the subimage list
          }}
        >
          <FaCheck />
          <span className='ml-2'>Done</span>
        </button>
      </div>
    </div>
  );
};

export default ImageDisplayNode;
