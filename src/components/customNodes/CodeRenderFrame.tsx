import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';
import { BoundingBox, defaultBoundingBox, loadingIdState } from '../../util';


const addEventHandlersToCode = (code: string) => {
    const handleMouseOver = `onMouseOver={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.add('highlight'); }}`;
    const handleMouseOut = `onMouseOut={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.remove('highlight'); }}`;
    const handleMouseUp = `onMouseUp={(e: React.MouseEvent<HTMLElement>) => { 
        setCurrentBbox();
        setTargetCodeRenderNodeId(nodeId);
        setTargetBlendCode(renderCode);
        setTargetCodeDropped(processHTMLElement(e.target).outerHTML); 
        console.log('mouse up from element:', e.target); }}`;

    // Use a more efficient regex with caching
    const regex = /<(\w+)([^>]*?)(\/?)>/g;
    const cache = new Map();
    
    return code.replace(regex, (match, p1, p2, p3) => {
        // Check cache first
        if (cache.has(match)) {
            return cache.get(match);
        }
        
        // Skip if already has handlers
        if (p2.includes('onMouseOver') || p2.includes('onMouseOut') || p2.includes('onMouseUp')) {
            cache.set(match, match);
            return match;
        }

        const isSelfClosing = p3 === '/';
        const result = isSelfClosing
            ? `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleMouseUp} />`
            : `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleMouseUp}>`;
        
        cache.set(match, result);
        return result;
    });
}

const processHTMLElement = (htmlElement: HTMLElement): HTMLElement | undefined => {

    if (!htmlElement) return undefined;

    if (htmlElement.classList && htmlElement.classList.contains("highlight")) {
        htmlElement.classList.remove("highlight");
    }

    // process if it's svg rendered, because it's hard to identify the source code with the rendered svg
    if (htmlElement.tagName === "path" || htmlElement.tagName === "circle") {
        if (htmlElement.parentElement) {
            return processHTMLElement(htmlElement.parentElement);
        }
    }

    return htmlElement;
};

interface CodeRenderFrameProps {
    nodeId: string;
    response: string;
    isMobile: boolean;
    renderCode: string;
    isDragging: boolean;
    setTargetBlendCode: (targetBlendCode: string) => void;
    setTargetCodeDropped: (html: string) => void;
    setTargetRenderCodeNodeBbox: (bbox: BoundingBox) => void;
    codeRenderNodeRef: React.RefObject<HTMLDivElement>;
    loadingStates: loadingIdState[];
    updateLoadingState: (targetId: string, newState: boolean) => void;
    setTargetCodeRenderNodeId: (nodeId: string) => void;
    abortController: AbortController | null;
}

const CodeRenderFrame: React.FC<CodeRenderFrameProps> = ({ nodeId, response, isMobile, renderCode, isDragging, setTargetBlendCode, setTargetCodeDropped, setTargetRenderCodeNodeBbox, codeRenderNodeRef, loadingStates, setTargetCodeRenderNodeId, updateLoadingState, abortController }) => {

    const [codeRenderNodeRect, setCodeRenderNodeRect] = useState<BoundingBox>(defaultBoundingBox);

    useEffect(() => {
        if (codeRenderNodeRef.current) {
            const rect = codeRenderNodeRef.current.getBoundingClientRect();
            setCodeRenderNodeRect(rect);
        }
    }, [codeRenderNodeRef]);

    // Memoize the processed code to avoid recalculation
    const processedCode = useMemo(() => {
        return isDragging ? addEventHandlersToCode(renderCode) : renderCode;
    }, [isDragging, renderCode])

    const cancelBlending = useCallback(() => {
        updateLoadingState(nodeId, false);
        abortController && abortController.abort();
    }, [nodeId, updateLoadingState, abortController]);

    const setCurrentBbox = useCallback(() => {
        if (codeRenderNodeRect) {
            const nodeClientBbox: BoundingBox = {
                x: codeRenderNodeRect.x,
                y: codeRenderNodeRect.y,
                width: codeRenderNodeRect.width,
                height: codeRenderNodeRect.height
            }
            setTargetRenderCodeNodeBbox(nodeClientBbox);
            console.log("setting current box: " + JSON.stringify(nodeClientBbox));
        } else {
            console.log("using default bbox");
            setTargetRenderCodeNodeBbox(defaultBoundingBox);
        }
    }, [codeRenderNodeRect, setTargetRenderCodeNodeBbox]);

    const isLoading = useMemo(() => {
        const currentNodeState = loadingStates.find(items => items.id === nodeId);
        return currentNodeState?.loading || false;
    }, [loadingStates, nodeId]);

    return (
        <div
            className={`code-render-container grow w-full overflow-auto relative
                    ${isLoading ? "invisible" : ""}
                    ${isDragging ? "flash" : ""}`}
        >
            <div className={`spinner-wrapper z-50 ${isLoading ? "visible" : "invisible"}`}>
                <div className={`spinner ${isLoading ? 'animate-spin' : ''}`}></div>
                <div className={`spinner inner ${isLoading ? 'animate-spin-reverse' : ''}`}></div>
                <div className='flex items-center w-full'>
                    <button
                        className="mt-12 mx-auto px-4 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-900 focus:outline-none"
                        onClick={cancelBlending}>
                        Cancel
                    </button>
                </div>
            </div>
            {/* removed for now: ${isMobile ? "max-w-md" : "max-w-screen-md"}  */}

            <div className={`absolute w-full h-full text-purple-400/80 ${isLoading ? "visible text-glow" : "invisible"}`}>
                {isLoading ? (response.length > 2000 ? response.slice(2000 * Math.floor(response.length / 2000)) : response) : ""}
            </div>

            <div className={`${isLoading ? "invisible" : ""}`}>
                <LiveProvider
                    code={processedCode}
                    scope={useMemo(() => ({
                        React, useState, ...LuIcons,
                        renderCode,
                        setTargetCodeRenderNodeId,
                        nodeId,
                        setTargetBlendCode,
                        setTargetCodeDropped,
                        setTargetRenderCodeNodeBbox,
                        processHTMLElement,
                        setCurrentBbox,
                        defaultBoundingBox,
                        codeRenderNodeRect
                    }), [renderCode, setTargetCodeRenderNodeId, nodeId, setTargetBlendCode, setTargetCodeDropped, setTargetRenderCodeNodeBbox, setCurrentBbox, codeRenderNodeRect])}
                >
                    <LivePreview />
                    <LiveError />
                </LiveProvider>
            </div>
        </div>
    );
};

export default CodeRenderFrame;