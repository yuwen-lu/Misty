import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { LuEqual } from 'react-icons/lu';
import 'reactflow/dist/style.css';
import '../../index.css';

const SubImageNode: React.FC<NodeProps> = ({ data }) => {
    const [localIsDragging, setLocalIsDragging] = useState<boolean | null>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const nodeRef = useRef<HTMLDivElement>(null);
    const [nodeWidth, setNodeWidth] = useState<number>(0);
    const draggedRef = useRef<HTMLDivElement>(null);
    const [draggedElementWidth, setdraggedElementWidth] = useState<number>(0);
    const reactFlow = useReactFlow();

    // set isDragging state both locally and in app tsx
    const syncIsDragging = (draggingState: boolean) => {
        setLocalIsDragging(draggingState);
        data.setIsDragging(draggingState);
    }

    const dismissDrag = (e: MouseEvent) => {
        // sometimes there are glitches, so if the user did not have the washitape released,
        // force click to release it
        // this will not interfere with the desired mousedown event, because the event trigger sequence is:
        // mousedown -> mouseup -> click, so isDragging will only be dismissed after the mouse is released
        if (localIsDragging) {
            syncIsDragging(false);
            return;
        }
    }

    const handleWashiDragStart = (e: MouseEvent) => {
        console.log('Drag start triggered'); // Debug log
        console.log((e.target as HTMLElement));
        console.log((e.target as HTMLElement).classList);
        // if we are dragging the handle, don't need to do anything, fallback to react flow default
        if ((e.target as HTMLElement).classList.contains('react-flow-drag-handle') || (e.target as HTMLElement).classList.contains('react-flow__handle')) {
            return;
        }


        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            setOffset({
                x: rect.left,
                y: rect.top,
            });
            const zoom = reactFlow.getZoom();

            setPosition({
                x: (e.clientX - rect.left) / zoom,  // using rect instead of offset, since the state variable might not be update here immediately
                y: (e.clientY - rect.top) / zoom,
            });
            syncIsDragging(true);
            e.stopPropagation();
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!localIsDragging) return;
        console.log((e.target as HTMLElement).classList);

        // if we are dragging the handle, don't need to do anything, fallback to react flow default
        if ((e.target as HTMLElement).classList.contains('react-flow-drag-handle')) {
            return;
        }
        console.log("from window: mouse move");
        if (localIsDragging) {
            const zoom = reactFlow.getZoom();

            setPosition({
                x: (e.clientX - offset.x) / zoom,
                y: (e.clientY - offset.y) / zoom,
            });
            console.log("node width: " + nodeWidth);
            console.log("x: " + e.clientX + ", y: " + e.clientY);
            console.log("corrected x: " + String(e.clientX - offset.x), ", corrected y: " + String(e.clientY - offset.y));
        }
        // e.stopPropagation();
    };

    // only handle this when the mouse is over code render frame, maybe do something with the event listener
    const handleMouseUp = (e: MouseEvent) => {
        if (!localIsDragging) return;
        console.log("washi tape dropped, current position, x: " + e.clientX + ", y: " + e.clientY);
        // send this back to App.tsx to show the blending options popup
        // we just use the view port default position
        const mousePosition = { x: e.clientX, y: e.clientY };

        if (isWithinAnyCodeRender(mousePosition.x, mousePosition.y)) {
            // we need this object because we need both the mouse position (to position the pop up)
            // and the subimagescreenshot (to construct the prompt when the popup is dismissed)
            const newConfirmationPopupNodeDataPackage = {
                mousePosition: mousePosition,
                subImageScreenshot: data.image,
            }
            data.setNewConfirmationPopupNodeDataPackage(newConfirmationPopupNodeDataPackage);
        }

        // reset states to default
        setPosition({ x: 0, y: 0 });
        setOffset({ x: 0, y: 0 });
        syncIsDragging(false);
        e.stopPropagation();
    };

    const isWithinAnyCodeRender = (x: number, y: number): boolean => {
        const containers = document.querySelectorAll('.code-render-container');
        for (const container of containers) {
            const rect = container.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return true;
            }
        }
        return false;
    };

    useEffect(() => {

        // initialize local isDragging
        if (!localIsDragging) setLocalIsDragging(data.isDragging);

        // if the user clicks on the rest of the screen, dismiss the drag
        // this will not interfere with the desired mousedown event, because the event trigger sequence is:
        // mousedown -> mouseup -> click, so isDragging will only be dismissed after the mouse is released
        window.addEventListener('click', dismissDrag);

        const node = nodeRef.current;
        const draggedNode = draggedRef.current
        if (node) {
            setNodeWidth(node.clientWidth);
            node.addEventListener('mousedown', handleWashiDragStart);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);
        }

        if (draggedNode) setdraggedElementWidth(draggedNode.clientWidth);

        return () => {
            if (node) {
                setNodeWidth(0);    // reset to default
                node.removeEventListener('mousedown', handleWashiDragStart);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('mousemove', handleMouseMove);
            }
            if (draggedNode) setdraggedElementWidth(0);
        };
    }, [localIsDragging, data]);

    return (
        <div ref={nodeRef} className="relative max-w-md mx-auto my-8">
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div className="absolute inset-0 bg-blue-900/70 transform rotate-1 rounded-sm"></div>
            <div className="relative bg-blue-900/70 p-5 text-white font-handwriting transform -rotate-1 rounded-sm shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-t-sm"></div>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20 rounded-b-sm"></div>
                <div className='flex flex-col items-center text-white bg-blue-900/70'>
                    <div className="w-full h-1 p-4 border-transparent border-4 react-flow-drag-handle cursor-move flex items-center justify-center">
                        <LuEqual className="react-flow-drag-handle" size={24} />
                    </div>
                    <div className='react-flow-drag-handle cursor-move text-l font-semibold mb-3 flex justify-center w-full items-center'>
                        <span className='react-flow-drag-handle'>Drag & Drop to Target</span>
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
            {localIsDragging && (
                <div
                    className="fixed z-5000 pointer-events-none"
                    ref={draggedRef}
                    style={{
                        // Calculate the appropriate attribute to use (left or right)
                        // if we don't do this, somehow the image will shrink once past one edge of the parent element
                        left: (position.x + draggedElementWidth < nodeWidth) ? `${position.x}px` : 'auto',
                        right: (position.x + draggedElementWidth < nodeWidth) ? 'auto' : `${nodeWidth - position.x}px`,
                        top: `${position.y}px`,
                        transform: (position.x + draggedElementWidth < nodeWidth) ? '' : 'translate(100%, 0%)',
                        // transform: 'translate(-50%, -50%)',
                        opacity: 0.8,
                    }}>
                    <div className="bg-blue-900/70 p-2 rounded-sm shadow-lg">
                        <img
                            className='rounded-md w-full h-32'
                            src={data.image}
                            alt="dragged_image"
                        />
                    </div>
                </div>
            )
            }

        </div >
    );
};

export default SubImageNode;
