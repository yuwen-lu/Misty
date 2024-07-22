import React, { useEffect, useState } from 'react';
import { useViewport } from 'reactflow';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';
import { BoundingBox, defaultBoundingBox } from '../../util';
import "../../index.css";

const addEventHandlersToCode = (code: string) => {
    const handleMouseOver = `onMouseOver={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.add('highlight'); }}`;
    const handleMouseOut = `onMouseOut={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.remove('highlight'); }}`;
    const handleMouseUp = `onMouseUp={(e: React.MouseEvent<HTMLElement>) => { 
        setCurrentBbox();
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
    isMobile: boolean;
    code: string;
    isDragging: boolean;
    setTargetCodeDropped: (html: string) => void;
    setTargetRenderCodeNodeBbox: (bbox: BoundingBox) => void;
    codeRenderNodeRef: React.RefObject<HTMLDivElement>;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    abortController: AbortController | null;
}

const CodeRenderFrame: React.FC<CodeRenderFrameProps> = ({ isMobile, code, isDragging, setTargetCodeDropped, setTargetRenderCodeNodeBbox, codeRenderNodeRef, loading, setLoading, abortController }) => {

    const [codeRenderNodeRect, setCodeRenderNodeRect] = useState<BoundingBox>(defaultBoundingBox);

    useEffect(() => {
        if (codeRenderNodeRef.current) setCodeRenderNodeRect(codeRenderNodeRef.current.getBoundingClientRect());
    }, []);

    const cancelBlending = () => {
        setLoading(false);
        abortController && abortController.abort();
    }

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

    return (
        <>
            <div className={`spinner-wrapper ${loading ? "" : "invisible"}`}>
                <div className={`spinner ${loading ? 'animate-spin' : ''}`}></div>
                <div className={`spinner inner ${loading ? 'animate-spin-reverse' : ''}`}></div>
                <div className='flex items-center w-full'>
                    <button
                        className="mt-12 mx-auto px-4 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-900 focus:outline-none"
                        onClick={ cancelBlending}>
                        Cancel
                    </button>
                </div>
            </div>

            <div
                className={`code-render-container grow w-full overflow-auto
                    ${isMobile ? "max-w-md" : "max-w-screen-md"} 
                    ${loading ? "invisible" : ""}
                    ${isDragging ? "flash" : ""}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
            >

                <LiveProvider
                    code={isDragging ? addEventHandlersToCode(code) : code}
                    scope={{
                        React, useState, ...LuIcons,
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
            </div></>
    );
};

export default CodeRenderFrame;