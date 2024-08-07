import React, { useEffect, useRef, useState } from 'react';
import { NodeProps, Handle, Position, NodeResizeControl } from 'reactflow';
import { LuTerminal, LuEqual, LuSmartphone, LuMonitor } from 'react-icons/lu';
import CodeRenderFrame from './CodeRenderFrame';
import { loadingIdState, tempChanges } from '../../util';
import DynamicUI from './DynamicUI';

const CodeRenderNode: React.FC<NodeProps> = ({ id, data, selected }) => {

    const [isMobile, setIsMobile] = useState<boolean>(true);
    const [code, setCode] = useState<string>("");
    const [hoverIdxList, sethoverIdxList] = useState<number[]>([]);
    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("hoverIdxList updated: " + hoverIdxList);
        let resultCode = code;
        if (hoverIdxList.length > 0) {
            for (let i = hoverIdxList.length - 1; i >= 0; i--) {
                // sometimes the target index might be off by a few index because of the variance of new&old values
                let targetIdx = hoverIdxList[i];
                console.log("Adding highlight to code section raw: " + resultCode.slice(targetIdx - 20, targetIdx) + " highlight " + resultCode.slice(targetIdx, targetIdx + 20));
                console.log("looking at char: " + resultCode.charAt(hoverIdxList[i]-1));
                console.log("Adding highlight to code section: " + resultCode.slice(targetIdx - 20, targetIdx) + " highlight " + resultCode.slice(targetIdx, targetIdx + 20));
                resultCode = resultCode.slice(0, targetIdx) + " highlight " + resultCode.slice(targetIdx);
            }
            setCode(resultCode);
        } else {
            setCode(resultCode.replaceAll(" highlight ", ""));
        }
    }, [hoverIdxList]);

    useEffect(() => {
        setCode(data.renderCode);
    }, [data.renderCode]);

    useEffect(() => {
        console.log("code updated in node, " + code);
    }, [code]);

    const handleToggle = () => {
        setIsMobile(!isMobile);
    };

    return (
        <div className='flex flex-row px-20 py-5 
            text-white bg-purple-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg 
            border-t-8 border-t-purple-900
            w-full h-full'>
            <div
                className={"flex flex-col min-w-96 items-center"}
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
                    response={data.response}
                    renderCode={code}
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
                                data.setDisplayCode(code);
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
                nodeId={id}
                prevCode={data.prevCode}    // this is the original source code for blending
                blendedCode={data.blendedCode}  // blended code, needed for resetting the node
                newCode={code}   // current code to display. will be the same as blendedCode, if no dynamic UI tweaks are performed
                categorizedChanges={data.categorizedChanges}
                handleCodeReplacement={data.handleCodeReplacement}
                sethoverIdxList={sethoverIdxList} />
        </div>
    );
};


export default CodeRenderNode;