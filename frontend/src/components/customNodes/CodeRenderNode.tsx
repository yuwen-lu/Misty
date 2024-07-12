import React, { useEffect, useRef, useState } from 'react';
import { Node, NodeProps, Handle, Position, NodeResizeControl, OnConnect, Connection } from 'reactflow';
import { LuTerminal, LuEqual, LuSmartphone, LuMonitor } from 'react-icons/lu';
import CodeRenderFrame from './CodeRenderFrame';

const CodeRenderNode: React.FC<NodeProps> = ({ data, selected }) => {

    const [isMobile, setIsMobile] = useState<boolean>(true);
    const nodeRef = useRef<HTMLDivElement>(null);


    const handleToggle = () => {
        setIsMobile(!isMobile);
    };

    // TODO test remove
    useEffect( () => {
        if (nodeRef.current) console.log("parent node ref width: " + nodeRef.current.getBoundingClientRect().width);
    }, []);

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
            <CodeRenderFrame
                isMobile={isMobile}
                code={data.code}
                isDragging={data.isDragging}
                setTargetCodeDropped={data.setTargetCodeDropped}
                setTargetRenderCodeNodeBbox={data.setTargetRenderCodeNodeBbox}
                codeRenderNodeRef={nodeRef} />
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