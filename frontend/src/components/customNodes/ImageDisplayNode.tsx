import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LuTrash2, LuUndo2, LuCheck, LuTrash } from 'react-icons/lu';
import { formatContent, draw, scribbleStrokeWidth, BoundingBox, mergeOverlappingBoundingBoxes, cropImage } from "../../util";
import 'reactflow/dist/style.css';
import '../../index.css';

const ImageDisplayNode: React.FC<NodeProps> = ({ id, data }) => {


  const [response, setResponse] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [paths, setPaths] = useState<{ x: number, y: number }[][]>([]); // record the paths of scribble
  const [boundingBoxes, setBoundingBoxes] = useState<{ x: number, y: number, width: number, height: number }[]>([]); // record bounding box to cut image
  const [subImageList, setSubImageList] = useState<string[]>([]);
  const [resizeRatio, setResizeRatio] = useState<number>(0);

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

    // account for resizing of the image in the bbox values
    return {
      x: minX * resizeRatio,
      y: (minY - scribbleStrokeWidth / 2) * resizeRatio,  // account for the thickness of the stroke in scribbling
      width: (maxX - minX) * resizeRatio,
      height: (maxY - minY + scribbleStrokeWidth) * resizeRatio,
    };
  };

  useEffect(() => {
    const handleLoad = () => {
      if (imgRef.current && canvasRef.current) {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;

        // Also, set the resize ratio so that we can more easily crop the image
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

  // whenever the paths are updated, update canvas drawing too
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    draw(canvas, context, paths);
  }, [paths])

  // using useEffect to handle the draw operations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      e.stopPropagation(); // Prevent ReactFlow from handling this event
    };

    // when mouse moves up, add the new path as a bounding box to the state variable.
    // we will process them together once a user confirms the selection (see func getMergedSubImages)
    const handleMouseUp = (e: MouseEvent) => {
      if (isDrawing) {
        setIsDrawing(false);
        const newPaths = paths[paths.length - 1];
        const newBox = getBoundingBox(newPaths);

        if (newBox) {
          setBoundingBoxes((prevBoxes) => {
            const newBoxes = [...prevBoxes];
            newBoxes.push(newBox);
            return newBoxes;
          });
        }
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

  const getMergedSubImages = () => {
    // first, merge all of the bounding boxes if there are overlaps
    const mergedBoxes = mergeOverlappingBoundingBoxes(boundingBoxes);
    // then get the corresponding sub images as base64 encoded strings
    (async () => {
      try {
        const croppedImages = await Promise.all(mergedBoxes.map(bbox => cropImage(data.image, bbox)));
        console.log(croppedImages); // Array of cropped base64 images
        setSubImageList((prevSubImageList) => {
          const newSubImageList = [...prevSubImageList];

          // add the new sub-image data to the list
          newSubImageList.push(...croppedImages);
          return newSubImageList;
        });
      } catch (error) {
        console.error(error);
      }
    })();
  }

  // when subImageList is updated, which happens in batch once Done button is pressed, send it to App.tsx
  useEffect(() => {
    if (subImageList.length > 0) {
      data.onSubImageConfirmed(id, subImageList);
      clearCanvas();
      setSubImageList([]);  // refresh the subimage list
    }
  }, [subImageList])

  // clear canvas
  const clearCanvas = () => {
    // clear the paths, the useEffect for paths will take care of re-draw
    setPaths([]);
    // clear the bounding boxes too
    setBoundingBoxes([]);
  }

  const undoCanvas = () => {

    // remove the last added path
    setPaths((prevPaths) => {
      const newPaths = [...prevPaths];
      newPaths.pop();
      return newPaths;
    });
    // remove the associated last bounding box
    setBoundingBoxes((prevBoxes) => {
      const newBoxes = [...prevBoxes];
      newBoxes.pop();
      return newBoxes;
    });
  }


  return (
    <div className="image-display-node flex flex-col items-center p-5 text-white bg-sky-800/70 rounded-lg border-2 border-sky-400">

      <div className='font-semibold text-xl mb-5'>
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
          className={`flex items-center rounded-lg transition-colors mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${paths.length > 0 ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400"}`}
          onClick={clearCanvas}
          disabled={paths.length === 0}
        >
          <LuTrash2 />
          <span className='ml-2'>Clear</span>
        </button>
        <button
          className={`flex items-center rounded-lg transition-colors mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${paths.length > 0 ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400"}`}
          onClick={undoCanvas}
          disabled={paths.length === 0}
        >
          <LuUndo2 />
          <span className='ml-2'>Undo</span>
        </button>
        <button
          className={`flex items-center rounded-lg transition-colors mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none ${paths.length > 0 ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400"}`}
          ref={canvasButtonRef}
          disabled={paths.length === 0}
          // onClick={() => dissectImage(data.image)}
          onClick={() => {
            getMergedSubImages();
          }}
        >
          <LuCheck />
          <span className='ml-2'>Done</span>
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="b"
        // style={{ bottom: 10, top: 'auto', background: '#555' }}
        isConnectable={true}
      />
    </div>
  );
};

export default ImageDisplayNode;
