import React, { useEffect, useState } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';
import { BoundingBox, defaultBoundingBox, loadingIdState } from '../../util';
import "../../index.css";

const addEventHandlersToCode = (code: string) => {
    const handleMouseOver = `onMouseOver={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.add('highlight'); }}`;
    const handleMouseOut = `onMouseOut={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.remove('highlight'); }}`;
    const handleMouseUp = `onMouseUp={(e: React.MouseEvent<HTMLElement>) => { 
        setCurrentBbox();
        setTargetCodeRenderNodeId(nodeId);
        setTargetBlendCode(renderCode);
        setTargetCodeDropped(processHTMLElement(e.target).outerHTML); 
        console.log('mouse up from element:', e.target); }}`;

    return code.replace(/<(\w+)([^>]*?)(\/?)>/g, (match, p1, p2, p3) => {
        // If the tag is self-closing, add a space before the closing slash
        const isSelfClosing = p3 === '/';

        // Skip elements that already have event handlers
        if (p2.includes('onMouseOver') || p2.includes('onMouseOut') || p2.includes('onMouseUp')) {
            return match;
        }

        if (isSelfClosing) {
            return `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleMouseUp} />`;
        } else {
            return `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleMouseUp}>`;
        }
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

const CodeRenderFrame: React.FC<CodeRenderFrameProps> = ({ nodeId, isMobile, renderCode, isDragging, setTargetBlendCode, setTargetCodeDropped, setTargetRenderCodeNodeBbox, codeRenderNodeRef, loadingStates, setTargetCodeRenderNodeId, updateLoadingState, abortController }) => {

    const [codeRenderNodeRect, setCodeRenderNodeRect] = useState<BoundingBox>(defaultBoundingBox);

    useEffect(() => {
        if (codeRenderNodeRef.current) setCodeRenderNodeRect(codeRenderNodeRef.current.getBoundingClientRect());
    }, []);

    useEffect(() => {
        console.log("dragging updated: " + isDragging);
    }, [isDragging]);

    const cancelBlending = () => {
        updateLoadingState(nodeId, false);
        abortController && abortController.abort();
    };

    const setCurrentBbox = () => {
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

    }

    const checkIsLoading = () => {
        const currentNodeState = loadingStates.find(items => items.id === nodeId);
        return currentNodeState?.loading;
    }

    return (
        <div
            className={`code-render-container grow w-full overflow-auto relative
                    ${checkIsLoading() ? "invisible" : ""}
                    ${isDragging ? "flash" : ""}`}
        >
            <div className={`spinner-wrapper z-50 ${checkIsLoading() ? "visible" : "invisible"}`}>
                <div className={`spinner ${checkIsLoading() ? 'animate-spin' : ''}`}></div>
                <div className={`spinner inner ${checkIsLoading() ? 'animate-spin-reverse' : ''}`}></div>
                <div className='flex items-center w-full'>
                    <button
                        className="mt-12 mx-auto px-4 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-900 focus:outline-none"
                        onClick={cancelBlending}>
                        Cancel
                    </button>
                </div>
            </div>
            {/* removed for now: ${isMobile ? "max-w-md" : "max-w-screen-md"}  */}

            <LiveProvider
                code={isDragging ? addEventHandlersToCode(renderCode) : renderCode}
                scope={{
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
                }}
            >
                <LivePreview />
                <LiveError />
            </LiveProvider>
        </div>
    );
};

export default CodeRenderFrame;