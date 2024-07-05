import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LuMove } from 'react-icons/lu';
import 'reactflow/dist/style.css';
import '../../index.css';

const SubImageNode: React.FC<NodeProps> = ({ data }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const nodeRef = useRef<HTMLDivElement>(null);

    const handleCustomDragStart = (e: React.MouseEvent) => {
        console.log("yuyuyuyuuy")
        console.log(e.target)
        if (nodeRef.current && e.target !== nodeRef.current.querySelector('.move-handle')) {
            console.log("HUhuuhuhuh");
            const rect = nodeRef.current.getBoundingClientRect();
            setOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
            setIsDragging(true);
            e.stopPropagation(); // Prevent React Flow from handling this event
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={nodeRef}
            className="relative max-w-md mx-auto my-8"
            onMouseDown={handleCustomDragStart}
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <div className="absolute inset-0 bg-blue-900/70 transform rotate-1 rounded-sm"></div>
            <div className="relative bg-blue-900/70 p-5 text-white font-handwriting transform -rotate-1 rounded-sm shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-t-sm"></div>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20 rounded-b-sm"></div>
                <div className='flex flex-col items-center p-5 text-white bg-blue-900/70'>
                    <div className='text-l mb-3 flex justify-between w-full items-center'>
                        <span>Selected Image Section</span>
                        <div className="move-handle cursor-move">
                            <LuMove size={24} />
                        </div>
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
                        transform: 'scale(0.5)',
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