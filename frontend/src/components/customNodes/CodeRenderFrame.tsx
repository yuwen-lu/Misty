import React, { useEffect, useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';
import "../../index.css";

function addEventHandlersToCode(code: string): string {
    const handleMouseOver = `onMouseOver={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.add('highlight'); }}`;
    const handleMouseOut = `onMouseOut={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); (e.target as HTMLElement).classList.remove('highlight'); }}`;
    const handleClick = `onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); console.log('Clicked element:', e.target); }}`;

    return code.replace(/<(\w+)([^>]*?)(\/?)>/g, (match, p1, p2, p3) => {
        // If the tag is self-closing, add a space before the closing slash
        const isSelfClosing = p3 === '/';

        // Skip elements that already have event handlers
        if (p2.includes('onMouseOver') || p2.includes('onMouseOut') || p2.includes('onClick')) {
            return match;
        }

        if (isSelfClosing) {
            return `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleClick} />`;
        } else {
            return `<${p1}${p2} ${handleMouseOver} ${handleMouseOut} ${handleClick}>`;
        }
    });
}

const CodeRenderFrame: React.FC<{ isMobile: boolean, code: string, isDragging: boolean }> = ({ isMobile, code, isDragging }) => {

    // useEffect(() => {
    //     console.log("Updated code: " + addEventHandlersToCode(code));
    // }, [code]);

    return (
        <div
            className={"code-render-container grow w-full overflow-auto " + (isMobile ? "max-w-md" : "max-w-screen-md")}
            style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
        >
            <LiveProvider code={isDragging ? addEventHandlersToCode(code) : code} scope={{ React, useState, ...LuIcons }}>
                <LivePreview />
                <LiveError />
            </LiveProvider>
        </div>
    );
};

export default CodeRenderFrame;
