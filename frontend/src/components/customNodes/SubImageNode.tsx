import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { LuMove } from 'react-icons/lu';
import 'reactflow/dist/style.css';
import '../../index.css';

const SubImageNode: React.FC<NodeProps> = ({ data }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const nodeRef = useRef<HTMLDivElement>(null);
    const reactFlow = useReactFlow();

    const handleWashiDragStart = (e: MouseEvent) => {
        console.log('Drag start triggered'); // Debug log
        console.log((e.target as HTMLElement));
        console.log((e.target as HTMLElement).classList);
        // if we are dragging the handle, don't need to do anything, fallback to react flow default
        if ((e.target as HTMLElement).classList.contains('react-flow-drag-handle')) {
            return;
        }


        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            console.log("rect: ", rect.toJSON());
            setOffset({
                x: rect.left,
                y: rect.top,
            });
            setIsDragging(true);
            e.stopPropagation();
            e.preventDefault();
        }
    };

    // TODO: 1. once drag past the node to the right, everything looks wrong; 2. mouse up always cannot be registered

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        console.log((e.target as HTMLElement).className);
        // if we are dragging the handle, don't need to do anything, fallback to react flow default
        if ((e.target as HTMLElement).className === 'react-flow-drag-handle') {
            return;
        }
        console.log("from window: mouse move");
        if (isDragging) {
            const zoom = reactFlow.getZoom();

            setPosition({
                x: (e.clientX - offset.x) / zoom,
                y: (e.clientY - offset.y) / zoom,
            });
            console.log("x: " + e.clientX + ", y: " + e.clientY);
            console.log("corrected x: " + String(e.clientX - offset.x), ", corrected y: " + String(e.clientY - offset.y));
        }
        // e.stopPropagation();
    };

    const handleMouseUp = (e: MouseEvent) => {
        console.log("from window: mouse up");
        setIsDragging(false);
        e.stopPropagation();
    };

    useEffect(() => {
        const node = nodeRef.current;
        if (node) {
            node.addEventListener('mousedown', handleWashiDragStart);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (node) {
                node.removeEventListener('mousedown', handleWashiDragStart);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [isDragging]);

    return (
        <div ref={nodeRef} className="relative max-w-md mx-auto my-8">
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <div className="absolute inset-0 bg-blue-900/70 transform rotate-1 rounded-sm"></div>
            <div className="relative bg-blue-900/70 p-5 text-white font-handwriting transform -rotate-1 rounded-sm shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-t-sm"></div>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20 rounded-b-sm"></div>
                <div className='flex flex-col items-center p-5 text-white bg-blue-900/70'>
                    <div className="absolute right-3 top-4 w-20 h-20 react-flow-drag-handle cursor-move flex items-center justify-center">
                        <LuMove className="react-flow-drag-handle" size={24} />
                    </div>
                    <div className='text-l mb-3 flex justify-between w-full items-center'>
                        <span>Selected Image Section</span>

                    </div>
                    <div className="w-full h-64 flex items-center justify-center overflow-hidden">
                        <img
                            className='rounded-md object-contain max-w-full max-h-full'
                            src={data.image}
                            alt="cropped_image"
                        />
                    </div>
                </div>
            </div>
            {isDragging && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        // transform: 'scale(0.5)',
                        opacity: 0.8,
                    }}
                >
                    <div className="bg-blue-900/70 p-2 rounded-sm shadow-lg">
                        <img
                            className='rounded-md object-contain w-32 h-32'
                            src={data.image}
                            alt="dragged_image"
                        />
                    </div>
                </div>
            )}
            <style>{`
        .bg-blue-900\/70 {
          background-color: rgba(30, 58, 138, 0.7);
        }
        .rounded-sm {
          border-radius: 0.125rem;
        }
      `}</style>
        </div>
    );
};

export default SubImageNode;
