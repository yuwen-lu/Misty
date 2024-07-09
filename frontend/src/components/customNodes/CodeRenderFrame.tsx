import React, { useEffect, useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { addEventHandlersToCode } from "../../util";
import * as LuIcons from 'react-icons/lu';
import "../../index.css";

const CodeRenderFrame: React.FC<{ isMobile: boolean, code: string }> = ({ isMobile, code }) => {
    
    // useEffect(() => {
    //     console.log("adapted code: \n" + addEventHandlersToCode(code));
    // }, [code]);

    return (
        <div
            className={"code-render-container grow w-full overflow-auto " + (isMobile ? "max-w-md" : "max-w-screen-md")}
            style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
        >
            <LiveProvider code={addEventHandlersToCode(code)} scope={{ React, useState, ...LuIcons }}>
                <LivePreview />
                <LiveError />
            </LiveProvider>
        </div>
    );
};

export default CodeRenderFrame;
