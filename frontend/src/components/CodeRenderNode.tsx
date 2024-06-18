import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { LuUndo2, LuCheck, LuTerminal } from 'react-icons/lu';
import CodeRenderIframe from './CodeRenderIframe';

const CodeRenderNode: React.FC<NodeProps> = ({ data, selected }) => {

    return (
        <div className="flex flex-col items-center p-5 text-white bg-stone-900/70 rounded-lg border-2 border-stone-400 w-full h-full">
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
            <NodeResizer isVisible={selected} minHeight={900} minWidth={400}/>
        </div>
    );
};

export default CodeRenderNode;