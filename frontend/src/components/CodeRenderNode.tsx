import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow';
import { LuUndo2, LuGripHorizontal, LuTerminal } from 'react-icons/lu';
import CodeRenderIframe from './CodeRenderIframe';

const CodeRenderNode: React.FC<NodeProps> = ({ data, selected }) => {

    return (
        <div className="flex flex-col items-center px-20 py-5 text-white bg-stone-900/70 rounded-lg border-2 border-stone-400 w-full h-full">
            <div className='font-semibold text-xl mb-5'>
                Source Code Render
            </div>
            <CodeRenderIframe />
            <div className='flex flex-row'>
                <button
                    className={"flex items-center rounded-lg mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                // onClick={clearCanvas}
                >
                    <LuTerminal />
                    <span className='ml-2'>Show Code</span>
                </button>
            </div>
            <NodeResizeControl style={{background: 'transparent', border: 'none'}} minWidth={500} minHeight={900}>
                <div style={{ color: "#ddd", position: 'absolute', right: 7, bottom: 5, visibility: selected ? "visible" : "hidden"  }}>
                    <LuGripHorizontal />
                </div>
            </NodeResizeControl>
        </div>
    );
};


export default CodeRenderNode;