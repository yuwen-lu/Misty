import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Node, NodeProps, Handle, Position, NodeResizeControl, OnConnect, Connection } from 'reactflow';
import { LuTerminal, LuEqual, LuSmartphone, LuMonitor } from 'react-icons/lu';
import CodeRenderFrame from './CodeRenderFrame';
import { BoundingBox, defaultBoundingBox } from '../../util';

const CodeRenderNode: React.FC<NodeProps> = ({ data, selected }) => {

    const [isMobile, setIsMobile] = useState<boolean>(true);
    const [handledNodes, setHandledNodes] = useState<Node>();

    const nodeRef = useRef<HTMLDivElement>(null);


    const handleToggle = () => {
        setIsMobile(!isMobile);
    };

    const getCurrentBbox = (e: MouseEvent) => {
        const node = nodeRef.current;
        if (node) {
            const bboxClientRect = node.getBoundingClientRect();
            const nodeClientBbox: BoundingBox = {
                x: bboxClientRect.x,
                y: bboxClientRect.y,
                width: bboxClientRect.width,
                height: bboxClientRect.height
            }
            data.setTargetRenderCodeNodeBbox(nodeClientBbox);
        } else {
            data.setTargetRenderCodeNodeBbox(defaultBoundingBox);
        }

    }

    useEffect(() => {
        // set the boundingbox of the code render node, so we can dynamically attach the explanations summary node
        const node = nodeRef.current;
        if (node) {
            node.addEventListener('mouseup', getCurrentBbox);
        } 
        return () => {
            if (node) node.removeEventListener('mouseup', getCurrentBbox);
        };

    }, [data]);

    return (
        <div
            className={`flex flex-col items-center px-20 py-5 text-white bg-purple-900/70 rounded-lg border-2 border-stone-400 w-full h-full `}
            ref={nodeRef}
        >
            <div className='w-full flex relative items-center mb-5'>
                <div className='absolute left-1/2 transform -translate-x-1/2 font-semibold text-xl'>
                    Source Code Render
                </div>
                <button
                    onClick={handleToggle}
                    className="ml-auto flex items-center justify-center px-1 py-1 bg-stone-700 rounded-full border border-stone-500 hover:bg-stone-600"
                >
                    <div className={`px-0.5 py-0.5 rounded-full ${isMobile ? "bg-stone-500" : ""} `}>
                        <LuSmartphone size={24} className={`transition-opacity duration-300 mx-2 my-1 ${isMobile ? 'opacity-100' : 'opacity-50'}`} />
                    </div>
                    <div className={`px-0.5 py-0.5 rounded-full ${!isMobile ? "bg-stone-500" : ""} `}>
                        <LuMonitor size={24} className={`transition-opacity duration-300 mx-2 my-1 ${isMobile ? 'opacity-50' : 'opacity-100'}`} />
                    </div>
                </button>

            </div>
            <CodeRenderFrame isMobile={isMobile} code={data.code} isDragging={data.isDragging} setTargetCodeDropped={data.setTargetCodeDropped} />
            <div className='flex flex-row'>
                <button
                    className={"flex items-center rounded-lg mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                    onClick={() => {
                        data.toggleCodePanelVisible();
                    }}
                >
                    <LuTerminal />
                    <span className='ml-2'>{data.codePanelVisible ? "Hide" : "Show"} Code</span>
                </button>
            </div>
            <NodeResizeControl style={{ background: 'transparent', border: 'none' }} minWidth={500} minHeight={900}>
                <div style={{ color: "#ddd", position: 'absolute', right: 7, bottom: 5, visibility: selected ? "visible" : "hidden" }}>
                    <LuEqual />
                </div>
            </NodeResizeControl>
            <Handle
                type="target"
                position={Position.Left}
                id="render-t"
                isConnectable={true}
            />
        </div >
    );
};


export default CodeRenderNode;