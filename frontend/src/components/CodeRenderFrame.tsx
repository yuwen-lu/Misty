import React, { useEffect, useRef, useState, ReactElement } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';

const CodeRenderFrame: React.FC<{ code: string }> = ({ code }) => {

    useEffect( () => {
        console.log("code changed");
    }, [code])

    return (
        <div
            className="code-render-container grow w-full overflow-auto"
            style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
        >
            <LiveProvider code={code} scope={{ ...LuIcons }}>
                <LivePreview />
                <LiveError />
            </LiveProvider>

        </div >
    );
};

export default CodeRenderFrame;
