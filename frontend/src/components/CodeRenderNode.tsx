import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { NodeProps, NodeResizeControl } from 'reactflow';
import { LuTerminal, LuEqual, LuSmartphone, LuMonitor } from 'react-icons/lu';
import CodeRenderFrame from './CodeRenderFrame';

const CodeRenderNode: React.FC<NodeProps> = ({ data, selected }) => {

    const [isMobile, setIsMobile] = useState<boolean>(true);

    const handleToggle = () => {
        setIsMobile(!isMobile);
    }

    return (
        <div className="flex flex-col items-center px-20 py-5 text-white bg-stone-900/70 rounded-lg border-2 border-stone-400 w-full h-full">
            <div className='w-full flex relative items-center mb-5'>
                <div className='absolute left-1/2 transform -translate-x-1/2 font-semibold text-xl'>
                    Source Code Render
                </div>
                <button
                    onClick={handleToggle}
                    className="ml-auto flex items-center justify-center p-2 bg-stone-700 rounded-full border border-stone-500 hover:bg-stone-600"
                >
                    <LuSmartphone size={24} className={`transition-opacity duration-300 mr-2 ${isMobile ? 'opacity-100' : 'opacity-50'}`} />
                    <LuMonitor size={24} className={`transition-opacity duration-300 mr-1 ${isMobile ? 'opacity-50' : 'opacity-100'}`} />
                </button>
            </div>
            <CodeRenderFrame isMobile={isMobile} code={data.code} />
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
        </div >
    );
};


export default CodeRenderNode;