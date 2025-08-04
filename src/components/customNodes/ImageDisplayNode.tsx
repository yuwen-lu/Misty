import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps, useViewport, useReactFlow } from 'reactflow';
import { LuTrash2, LuUndo2, LuCheck } from 'react-icons/lu';
import { BoundingBox, cropImage } from "../../util";


const ImageDisplayNode: React.FC<NodeProps> = React.memo(({ id, data, selected }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>();
  const [subImageList, setSubImageList] = useState<string[]>([]);
  const [resizeRatio, setResizeRatio] = useState<number>(1);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasButtonRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const requestRef = useRef<number>();
  
  const { zoom, x: panX, y: panY } = useViewport();
  const reactFlowInstance = useReactFlow();

  // Convert screen coordinates to canvas coordinates, accounting for React Flow transforms
  const screenToCanvasCoordinates = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position relative to canvas
    // getBoundingClientRect already accounts for CSS transforms applied by React Flow
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    
    // Scale coordinates to match canvas internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    // Clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(scaledX, canvas.width));
    const clampedY = Math.max(0, Math.min(scaledY, canvas.height));
    
    // console.log('Coordinate conversion debug:', {
    //   screenX,
    //   screenY,
    //   rectLeft: rect.left,
    //   rectTop: rect.top,
    //   rectWidth: rect.width,
    //   rectHeight: rect.height,
    //   canvasWidth: canvas.width,
    //   canvasHeight: canvas.height,
    //   scaleX,
    //   scaleY,
    //   rawX: x,
    //   rawY: y,
    //   scaledX,
    //   scaledY,
    //   clampedX,
    //   clampedY
    // });
    
    return { x: clampedX, y: clampedY };
  }, []);

  const getBoundingBoxFromPoints = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    return { x, y, width, height };
  };

  // Convert display coordinates to natural image coordinates for cropping
  const getImageCoordinatesFromDisplayBox = (displayBox: { x: number, y: number, width: number, height: number }) => {
    if (!imgRef.current) return displayBox;
    
    const img = imgRef.current;
    // Calculate the actual resize ratio based on the current image dimensions
    // This accounts for any zoom changes that might have affected the display size
    const currentRatio = img.naturalWidth / img.offsetWidth;
    
    return {
      x: displayBox.x * currentRatio,
      y: displayBox.y * currentRatio,
      width: displayBox.width * currentRatio,
      height: displayBox.height * currentRatio,
    };
  };

  const initializeCanvas = useCallback(() => {
    if (imgRef.current && canvasRef.current) {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      
      // Wait for next frame to ensure image is fully rendered with CSS constraints
      requestAnimationFrame(() => {
        
        // Set canvas size to match displayed image size
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        
        // Also set CSS size to match exactly
        canvas.style.width = img.offsetWidth + 'px';
        canvas.style.height = img.offsetHeight + 'px';
        
        // Calculate resize ratio for coordinate mapping
        const ratio = img.naturalWidth / img.offsetWidth;
        setResizeRatio(ratio);
        setCanvasInitialized(true);
        
        // console.log('Canvas initialized:', {
        //   canvasWidth: canvas.width,
        //   canvasHeight: canvas.height,
        //   imgOffsetWidth: img.offsetWidth,
        //   imgOffsetHeight: img.offsetHeight,
        //   imgClientWidth: img.clientWidth,
        //   imgClientHeight: img.clientHeight,
        //   ratio: ratio
        // });
        
        // Clear any existing drawings
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    }
  }, []);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (imgElement) {
      if (imgElement.complete && imgElement.naturalWidth > 0) {
        initializeCanvas();
      } else {
        imgElement.addEventListener('load', initializeCanvas);
        return () => imgElement.removeEventListener('load', initializeCanvas);
      }
    }
  }, [initializeCanvas]);

  // Re-initialize canvas when zoom changes significantly
  useEffect(() => {
    if (canvasInitialized && imgRef.current) {
      const timeoutId = setTimeout(() => {
        // Clear any existing crop state when zoom changes
        setBoundingBox(null);
        setIsDrawing(false);
        setStartPoint({ x: 0, y: 0 });
        setEndPoint({ x: 0, y: 0 });
        initializeCanvas();
      }, 100); // Debounce canvas reinitialization
      return () => clearTimeout(timeoutId);
    }
  }, [zoom, canvasInitialized, initializeCanvas]);


  // Event handlers with proper cleanup
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!canvasInitialized) return;
    
    // Prevent React Flow from handling this event
    e.stopPropagation();
    e.preventDefault();
    
    setIsDrawing(true);
    setBoundingBox(null);
    
    // Convert screen coordinates to canvas coordinates with React Flow transforms
    const { x, y } = screenToCanvasCoordinates(e.clientX, e.clientY);
    
    // console.log('Mouse down debug:', {
    //   zoom,
    //   clientX: e.clientX,
    //   clientY: e.clientY,
    //   convertedX: x,
    //   convertedY: y
    // });
    
    setStartPoint({ x, y });
    setEndPoint({ x, y });
  }, [canvasInitialized, zoom, screenToCanvasCoordinates]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing) return;
    
    // Prevent React Flow from handling this event
    e.stopPropagation();
    e.preventDefault();
    
    // Convert screen coordinates to canvas coordinates with React Flow transforms
    const { x, y } = screenToCanvasCoordinates(e.clientX, e.clientY);
    setEndPoint({ x, y });
  }, [isDrawing, screenToCanvasCoordinates]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDrawing) return;
    
    // Prevent React Flow from handling this event
    e.stopPropagation();
    e.preventDefault();
    
    setIsDrawing(false);
    const newBox = getBoundingBoxFromPoints(startPoint, endPoint);
    if (newBox && newBox.width > 5 && newBox.height > 5) { // Minimum size threshold
      setBoundingBox(newBox);
    }
  }, [isDrawing, startPoint, endPoint]);

  const drawBoundingBoxes = useCallback(
    (
      canvas: HTMLCanvasElement,
      context: CanvasRenderingContext2D,
      box: BoundingBox | null | undefined,
      startPt: { x: number, y: number },
      endPt: { x: number, y: number },
      drawing: boolean
    ) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = 'rgb(92, 131, 242)';
      context.setLineDash([5, 3]);
      context.lineWidth = 2;

      // Draw existing bounding box (box is in display coordinates)
      if (box) {
        context.strokeRect(box.x, box.y, box.width, box.height);
        context.fillStyle = 'rgba(29, 78, 216, 0.2)';
        context.fillRect(box.x, box.y, box.width, box.height);
      }
      
      // Draw current selection while drawing (coordinates are in display space)
      if (drawing) {
        const currentBox = getBoundingBoxFromPoints(startPt, endPt);
        context.strokeStyle = 'rgb(92, 131, 242)';
        context.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      }
    },
    [resizeRatio]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasInitialized) return;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return;
    }
    
    // Use requestAnimationFrame for smooth rendering
    const animate = () => {
      drawBoundingBoxes(canvas, context, boundingBox, startPoint, endPoint, isDrawing);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [boundingBox, startPoint, endPoint, isDrawing, drawBoundingBoxes, canvasInitialized]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasInitialized) return;
    
    // Only listen for mousedown on canvas
    canvas.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseDown, canvasInitialized]);

  // Separate effect for document-level mouse events during dragging
  useEffect(() => {
    if (!isDrawing) return;
    
    const handleMove = (e: MouseEvent) => handleMouseMove(e);
    const handleUp = (e: MouseEvent) => handleMouseUp(e);
    
    // Listen on document so we can track mouse outside canvas
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDrawing, handleMouseMove, handleMouseUp]);  

  const getMergedSubImages = async () => {
    try {
      if (boundingBox && imgRef.current) {
        const img = imgRef.current;
        // Convert display coordinates to natural image coordinates for cropping
        const imageCoordinates = getImageCoordinatesFromDisplayBox(boundingBox);
        
        // console.log('Crop coordinates debug:', {
        //   zoom,
        //   displayBox: boundingBox,
        //   imageCoordinates,
        //   imgOffsetWidth: img.offsetWidth,
        //   imgOffsetHeight: img.offsetHeight,
        //   imgNaturalWidth: img.naturalWidth,
        //   imgNaturalHeight: img.naturalHeight,
        //   currentRatio: img.naturalWidth / img.offsetWidth,
        //   storedResizeRatio: resizeRatio
        // });
        
        const croppedImage = await cropImage(data.image, imageCoordinates);
        // console.log(croppedImage);
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
        <canvas 
          ref={canvasRef} 
          className='absolute top-0 left-0 z-10' 
          style={{ 
            pointerEvents: 'auto',
            touchAction: 'none' // Prevent touch scrolling on canvas
          }}
        ></canvas>
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
