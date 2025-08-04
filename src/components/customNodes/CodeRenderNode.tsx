import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { NodeProps, Handle, Position, NodeResizeControl } from 'reactflow';
import { LuTerminal, LuEqual, LuSmartphone, LuMonitor } from 'react-icons/lu';
import CodeRenderFrame from './CodeRenderFrame';
import { defaultBoundingBox, loadingIdState, tempChanges } from '../../util';
import DynamicUI from './DynamicUI';

import { RotateCcw, Sparkles, Hammer } from 'lucide-react';


const CodeRenderNode: React.FC<NodeProps> = React.memo(({ id, data, selected }) => {

    const [isMobile, setIsMobile] = useState<boolean>(true);
    const [code, setCode] = useState<string>("");
    const [hoverIdxList, sethoverIdxList] = useState<number[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isAnimatingHammer, setIsAnimatingHammer] = useState(false);

    const nodeRef = useRef<HTMLDivElement>(null);

    const [originalClassNames, setOriginalClassNames] = useState<string[]>([]);
    const [replacementClassNames, setReplacementClassNames] = useState<string[]>([]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAnimating) {
            timer = setTimeout(() => setIsAnimating(false), 500); // Total animation duration
        }
        if (isAnimatingHammer) {
            timer = setTimeout(() => setIsAnimatingHammer(false), 500); // Total animation duration
        }
        return () => clearTimeout(timer);
    }, [isAnimating, isAnimatingHammer]);

    const classNameStartString = "className=";
    const processHoverHighlight = useCallback((hoverList: number[], renderCode: string) => {
        if (hoverList.length === 0) {
            return renderCode.replaceAll("highlight-gray", "");
        }

        let resultCode = renderCode;
        const newOriginalClassNames: string[] = [];
        const newReplacementClassNames: string[] = [];

        for (let i = hoverList.length - 1; i >= 0; i--) {
            const targetIdx = hoverList[i];
            const beforeTarget = resultCode.slice(0, targetIdx);
            const afterTarget = resultCode.slice(targetIdx);
            const classNameMatchIdx = beforeTarget.lastIndexOf(classNameStartString) + classNameStartString.length;
            const quoteChar = resultCode.charAt(classNameMatchIdx);
            const classNameMatchEndIdx = afterTarget.indexOf(quoteChar) + beforeTarget.length;

            if (classNameMatchIdx !== -1 && classNameMatchEndIdx !== -1) {
                const matchedClassName = resultCode.slice(classNameMatchIdx, classNameMatchEndIdx + 1);
                let updatedClassName = matchedClassName;
                newOriginalClassNames.push(matchedClassName);
                
                if (matchedClassName.includes("bg-")) {
                    updatedClassName = updatedClassName.slice(1, -1);
                    updatedClassName = updatedClassName.split(' ').filter(cls => !cls.startsWith('bg-')).join(' ');
                    updatedClassName = quoteChar + updatedClassName + quoteChar;
                }
                updatedClassName = updatedClassName.slice(0, 1) + "highlight-gray " + updatedClassName.slice(1);
                newReplacementClassNames.push(updatedClassName);
                resultCode = resultCode.replaceAll(matchedClassName, updatedClassName);
            }
        }

        setOriginalClassNames(newOriginalClassNames);
        setReplacementClassNames(newReplacementClassNames);
        return resultCode;
    }, []);

    useEffect(() => {
        const processedCode = processHoverHighlight(hoverIdxList, data.renderCode);
        setCode(processedCode);
    }, [hoverIdxList, data.renderCode, processHoverHighlight]);

    useEffect(() => {
        setCode(data.renderCode);

        const sourceNodeId = data.sourceNodeId;
        if (sourceNodeId) {
            const newEdgeId = `e-${sourceNodeId}-${id}`;
            const newEdge = {
                id: newEdgeId,
                source: sourceNodeId,
                target: id,
            };
            // Add the new edge
            data.addNewEdge(newEdge);
        }
    }, [data.renderCode, data.sourceNodeId, id]);

    const handleToggle = useCallback(() => {
        setIsMobile(!isMobile);
    }, [isMobile]);

    const regenerateCode = useCallback(() => {
        if (!isAnimating) {
            setIsAnimating(true);
        }
        console.log("huh? \n" + data.base64Image);
        data.handleFetchResponse(
            data.textPrompt,
            data.base64Image,
            true,
            undefined,
            code,
            id,
            true,
            data.sourceNodeId,
            true
        );
    }, [isAnimating, data, code, id]);

    const fixCodeNotRendering = useCallback(() => {
        if (!isAnimatingHammer) {
            setIsAnimatingHammer(true);
        }
        data.fixCodeNotRendering(code, id);
    }, [isAnimatingHammer, data, code, id]);


    return (
        <div className={`flex flex-row px-20 py-5 
            text-white bg-purple-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg 
                border-t-8 border-t-purple-900
            w-full h-full 
            transition-shadow duration-300 ease-in-out ${selected ? 'shadow-2xl ring-4 ring-purple-500 ring-opacity-50' : ''}`}>
            <div
                className="render-view-container flex flex-col items-center"
                ref={nodeRef}
            >
                <div className='w-full flex relative items-begin mb-6'>
                    <div className='text-purple-900 absolute left-1/2 transform -translate-x-1/2 font-semibold text-xl '>
                        {/* <div className='w-full text-center font-semibold text-purple-900 text-xl mb-5'> */}
                        Code Render
                    </div>

                    {data.categorizedChanges && data.categorizedChanges.length > 0 ? <div className='ml-auto flex'>
                        <button
                            className='flex items-center space-x-2 font-normal text-md text-purple-900 px-4 mt-12 rounded'
                            onClick={fixCodeNotRendering}>
                            <Hammer
                                className={`transition-all duration-1500 ease-in-out ${isAnimatingHammer ? 'animate-complex-rotate' : ''
                                    }`}
                            />
                            <span>Fix Render</span>
                        </button>
                        <button
                            className='flex items-center space-x-2 font-normal text-md text-purple-900 px-4 mt-12 rounded'
                            onClick={regenerateCode}>
                            <Sparkles
                                className={`transition-all duration-1500 ease-in-out ${isAnimating ? 'animate-complex-rotate' : ''
                                    }`}
                            />
                            <span>Regenerate</span>
                        </button>
                    </div> : <div className='invisible'>btn placeholder for space</div>}
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
                    style={{
                        width: '20px',
                        height: '60px',
                        borderRadius: '5px',
                        borderWidth: '2px',
                        borderColor: 'white',
                        borderStyle: 'solid',
                        marginLeft: '-5px',
                    }}
                    className="bg-purple-900 opacity-50"
                />
            </div >
            <DynamicUI
                nodeId={id}
                prevCode={data.prevCode}    // this is the original source code for blending
                blendedCode={data.blendedCode}  // blended code, needed for resetting the node
                newCode={code}   // current code to display. will be the same as blendedCode, if no dynamic UI tweaks are performed
                categorizedChanges={data.categorizedChanges}
                handleCodeReplacement={data.handleCodeReplacement}
                fetchSemanticDiffingResponse={data.fetchSemanticDiffingResponse}
                sethoverIdxList={sethoverIdxList} />
        </div>
    );
});


export default CodeRenderNode;