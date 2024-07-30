import React, { useEffect, useRef, useState } from 'react';
import { NodeProps, Handle, Position, NodeResizeControl, OnConnect, Connection, useViewport } from 'reactflow';
import { LuTerminal, LuEqual, LuSmartphone, LuMonitor } from 'react-icons/lu';
import CodeRenderFrame from './CodeRenderFrame';
import { loadingIdState, tempChanges } from '../../util';
import DynamicUI from './DynamicUI';

const CodeRenderNode: React.FC<NodeProps> = ({ id, data, selected }) => {

    const [isMobile, setIsMobile] = useState<boolean>(true);
    const nodeRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        setIsMobile(!isMobile);
    };

    return (
        <div className='flex flex-row px-20 py-5 
            text-white bg-purple-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg 
            border-t-8 border-t-purple-900
            w-full h-full'>
            <div
                className={"flex flex-col items-center"}
                ref={nodeRef}
            >
                <div className='w-full flex relative items-center'>
                    {/* <div className='text-purple-900 absolute left-1/2 transform -translate-x-1/2 font-semibold text-xl my-5'> */}
                    <div className='w-full text-center font-semibold text-purple-900 text-xl mb-5'>
                        Code Render
                    </div>
                    {/* </div> */}
                    {/* <button
                    onClick={handleToggle}
                    className="ml-auto flex items-center justify-center px-1 py-1 bg-stone-700 rounded-full border border-stone-500 hover:bg-stone-600"
                >
                    <div className={`px-0.5 py-0.5 rounded-full ${isMobile ? "bg-stone-500" : ""} `}>
                        <LuSmartphone size={24} className={`transition-opacity duration-300 mx-2 my-1 ${isMobile ? 'opacity-100' : 'opacity-50'}`} />
                    </div>
                    <div className={`px-0.5 py-0.5 rounded-full ${!isMobile ? "bg-stone-500" : ""} `}>
                        <LuMonitor size={24} className={`transition-opacity duration-300 mx-2 my-1 ${isMobile ? 'opacity-50' : 'opacity-100'}`} />
                    </div>
                </button> */}

                </div>
                <CodeRenderFrame
                    nodeId={id}
                    isMobile={isMobile}
                    renderCode={data.renderCode}
                    isDragging={data.isDragging}
                    setTargetBlendCode={data.setTargetBlendCode}
                    setTargetCodeDropped={data.setTargetCodeDropped}
                    setTargetRenderCodeNodeBbox={data.setTargetRenderCodeNodeBbox}
                    codeRenderNodeRef={nodeRef}
                    loadingStates={data.loadingStates}
                    updateLoadingState={data.updateLoadingState}
                    setTargetCodeRenderNodeId={data.setTargetCodeRenderNodeId}
                    abortController={data.abortController} />
                <div className='flex flex-row'>
                    <button
                        className={"flex items-center rounded-lg mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                        onClick={() => {
                            if (!data.codePanelVisible) {   // if the code panel is not currently visible, we set the display code to this code piece
                                data.setDisplayCode(data.renderCode);
                            } else {
                                data.setDisplayCode("");
                            }
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
            <DynamicUI 
                changes={tempChanges} 
                useViewport={useViewport}/>
        </div>
    );
};


export default CodeRenderNode;