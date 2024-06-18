import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow';
import { LuUndo2, LuCheck, LuTerminal } from 'react-icons/lu';
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
            <NodeResizeControl style={{ visibility: selected ? "visible" : "hidden" }}  minWidth={500} minHeight={900}>
                <ResizeIcon />
            </NodeResizeControl>
        </div>
    );
};

function ResizeIcon() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="#fff"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', right: 5, bottom: 5 }}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <polyline points="16 20 20 20 20 16" />
        <line x1="14" y1="14" x2="20" y2="20" />
        <polyline points="8 4 4 4 4 8" />
        <line x1="4" y1="4" x2="10" y2="10" />
      </svg>
    );
  }
  

export default CodeRenderNode;