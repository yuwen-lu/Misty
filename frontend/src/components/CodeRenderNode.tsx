import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Handle, Position, NodeProps } from 'reactflow';
import { LuTrash2, LuUndo2, LuCheck } from 'react-icons/lu';
import CodeRenderIframe from './CodeRenderIframe';

const CodeRenderNode: React.FC<NodeProps> = ({ data }) => {

    return (
        <div className="image-display-node flex flex-col items-center p-5 text-white bg-stone-900/70 rounded-lg border-2 border-stone-400 relative">
            <div className='font-semibold text-xl mb-5'>
                Source Code Render
            </div>
            <div className='image-display-section relative'>
                <CodeRenderIframe />
            </div>
            <div className='flex flex-row'>
                <button
                    className={"flex items-center rounded-full mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                // onClick={clearCanvas}
                >
                    <LuTrash2 />
                    <span className='ml-2'>Clear</span>
                </button>
                <button
                    className={"flex items-center rounded-full mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                // onClick={undoCanvas}
                >
                    <LuUndo2 />
                    <span className='ml-2'>Undo</span>
                </button>
                <button
                    className={"flex items-center rounded-full mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                // onClick={() => dissectImage(data.image)}
                // onClick={() => {
                //     getMergedSubImages();
                // }}
                >
                    <LuCheck />
                    <span className='ml-2'>Done</span>
                </button>
            </div>
        </div>
    );
};

export default CodeRenderNode;