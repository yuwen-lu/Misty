import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LuTrash2, LuUndo2, LuCheck } from 'react-icons/lu';
import { BoundingBox, cropImage } from "../../util";


const ImageDisplayNode: React.FC<NodeProps> = React.memo(({ id, data, selected }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  // const [boundingBoxes, setBoundingBoxes] = useState<{ x: number, y: number, width: number, height: number }[]>([]);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>();
  const [subImageList, setSubImageList] = useState<string[]>([]);
  const [resizeRatio, setResizeRatio] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasButtonRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const getBoundingBoxFromPoints = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    return {
      x: x * resizeRatio,
      y: y * resizeRatio,
      width: width * resizeRatio,
      height: height * resizeRatio,
    };
  };

  useEffect(() => {
    const handleLoad = () => {
      if (imgRef.current && canvasRef.current) {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;

        setResizeRatio(img.naturalWidth / img.width);
        console.log("resize ratio: " + img.naturalWidth / img.width);
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

  useEffect(() => {


    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    drawBoundingBoxes(canvas, context, boundingBox, startPoint, endPoint, isDrawing);
  }, [boundingBox, startPoint, endPoint, isDrawing]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setIsDrawing(true);
      setBoundingBox(null); // remove the previous box
      const { offsetX, offsetY } = e;
      setStartPoint({ x: offsetX, y: offsetY });
      setEndPoint({ x: offsetX, y: offsetY });
      e.stopPropagation();
    };
  
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
  
      const { offsetX, offsetY } = e;
      setEndPoint({ x: offsetX, y: offsetY });
      e.stopPropagation();
    };
  
    const handleMouseUp = (e: MouseEvent) => {
      if (isDrawing) {
        setIsDrawing(false);
        const newBox = getBoundingBoxFromPoints(startPoint, endPoint);
        if (newBox) {
          setBoundingBox(newBox);
        }
      }
      e.stopPropagation();
    };
  
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
    }
    document.addEventListener('mousemove', handleMouseMove);
  
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
      }
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDrawing, startPoint, endPoint]);  

  const getMergedSubImages = async () => {
    try {
      if (boundingBox) {
        const croppedImage = await cropImage(data.image, boundingBox);
        console.log(croppedImage);
        setSubImageList((prevSubImageList) => [...prevSubImageList, croppedImage]);
      }
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    if (subImageList.length > 0) {
      data.onSubImageConfirmed(id, subImageList);
      clearCanvas();
      setSubImageList([]);
    }
  }, [subImageList]);

  const clearCanvas = () => {
    setBoundingBox(null);
  };

  const undoCanvas = () => {
    setBoundingBox(null);
  };

  const drawBoundingBoxes = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    // boxes: { x: number, y: number, width: number, height: number }[],
    box: BoundingBox | null | undefined,
    startPoint: { x: number, y: number },
    endPoint: { x: number, y: number },
    isDrawing: boolean
  ) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgb(92, 131, 242)';
    context.setLineDash([5, 3]);
    context.lineWidth = 2;

    // Draw bounding boxes
    if (box) {
      context.strokeRect(box.x / resizeRatio, box.y / resizeRatio, box.width / resizeRatio, box.height / resizeRatio);
      // Apply the breathing effect
      context.fillStyle = 'rgba(29, 78, 216, 0.2)';
      context.fillRect(box.x / resizeRatio, box.y / resizeRatio, box.width / resizeRatio, box.height / resizeRatio);
    }
    // Draw the current bounding box with breathing effect if drawing
    if (isDrawing) {
      const currentBox = getBoundingBoxFromPoints(startPoint, endPoint);
      context.strokeStyle = 'rgb(92, 131, 242)';
      context.strokeRect(currentBox.x / resizeRatio, currentBox.y / resizeRatio, currentBox.width / resizeRatio, currentBox.height / resizeRatio);

    }
  };


  return (
    <div className={`image-display-node flex flex-col items-center 
                      px-20 py-5 
                      text-white bg-blue-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg 
                      border-t-8 border-t-blue-900
                      w-full h-full 
                      transition-all duration-300 ease-in-out ${selected ? 'shadow-2xl transform scale-105 ' : ''}`}>

      <div className='font-semibold text-blue-900 text-xl mb-5'>
        Reference Example
      </div>

      <div className='image-display-section relative cursor-crosshair'>
        <img
          ref={imgRef}
          className='rounded-md cursor-crosshair'
          src={data.image}
          alt="Uploaded"
          style={{ maxWidth: '30rem', maxHeight: '40rem' }}
        />
        <canvas ref={canvasRef} className='absolute top-0 left-0 z-10'></canvas>
      </div>

      <div className='flex flex-row'>
        {/* <button
          className={`flex items-center rounded-lg transition-colors mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${boundingBoxes.length > 0 ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400"}`}
          onClick={clearCanvas}
          disabled={boundingBoxes.length === 0}
        >
          <LuTrash2 />
          <span className='ml-2'>Clear</span>
        </button> */}
        <button
          className={`flex items-center rounded-lg transition-colors mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${boundingBox ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400"}`}
          onClick={undoCanvas}
          disabled={!boundingBox}
        >
          <LuUndo2 />
          <span className='ml-2'>Undo</span>
        </button>
        <button
          className={`flex items-center rounded-lg transition-colors mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${boundingBox ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400"}`}
          ref={canvasButtonRef}
          disabled={!boundingBox}
          onClick={getMergedSubImages}
        >
          <LuCheck />
          <span className='ml-2'>Done</span>
        </button>
      </div>
      <Handle
        className="bg-blue-900 opacity-50"
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

export default ImageDisplayNode;
