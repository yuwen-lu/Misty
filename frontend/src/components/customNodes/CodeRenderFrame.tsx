import React, { useEffect, useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';
import "../../index.css";

const addEventHandlersToCode = (code: string) => {
    const handleMouseOver = `onMouseOver={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.add('highlight'); }}`;
    const handleMouseOut = `onMouseOut={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.remove('highlight'); }}`;
    const handleMouseUp = `onMouseUp={(e: React.MouseEvent<HTMLElement>) => { setTargetCodeDropped(getSVGElementParent(e.target.outerHTML)); console.log('mouse up from element:', e.target); }}`;

    return code.replace(/<(\w+)([^>]*?)(\/?)>/g, (match, p1, p2, p3) => {
        // If the tag is self-closing, add a space before the closing slash
        const isSelfClosing = p3 === '/';

        // Skip elements that already have event handlers
        if (p2.includes('onMouseOver') || p2.includes('onMouseOut') || p2.includes('onClick')) {
            return match;
        }

        if (isSelfClosing) {
            return `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleMouseUp} />`;
        } else {
            return `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleMouseUp}>`;
        }
    });
}

const getSVGElementParent = (htmlElement: HTMLElement): HTMLElement | undefined => {
    if (!htmlElement) return undefined;
    
    if (htmlElement.tagName === "path" || htmlElement.tagName === "circle") {
        if (htmlElement.parentElement) {
            return getSVGElementParent(htmlElement.parentElement);
        }
    }
    
    return htmlElement;
};

const CodeRenderFrame: React.FC<{ isMobile: boolean, code: string, isDragging: boolean, setTargetCodeDropped: Function }> = ({ isMobile, code, isDragging, setTargetCodeDropped }) => {

    return (
        <div
            className={`code-render-container grow w-full overflow-auto 
            ${isMobile ? "max-w-md" : "max-w-screen-md"} 
            ${isDragging ? "flash" : ""}`}
            style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
        >
            <LiveProvider
                code={isDragging ? addEventHandlersToCode(code) : code} scope={{ React, useState, ...LuIcons, setTargetCodeDropped, getSVGElementParent }}
            >
                <LivePreview />
                <LiveError />
            </LiveProvider>
        </div>
    );
};

export default CodeRenderFrame;
