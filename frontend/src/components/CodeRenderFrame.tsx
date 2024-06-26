import React, { useEffect, useRef, useState, ReactElement } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';

const CodeRenderFrame: React.FC<{ isMobile: boolean, code: string }> = ({ isMobile, code }) => {

    const [renderCode, setRenderCode] = useState(code);

    useEffect(() => {
        setRenderCode(code);
    }, [code]);

    return (
        <div
            className={"code-render-container grow w-full overflow-auto " + (isMobile ? "max-w-md" : "max-w-screen-md")}
            style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
        >
            <LiveProvider code={renderCode} scope={{ ...LuIcons }}>
                <LivePreview />
                <LiveError />
            </LiveProvider>

        </div >
    );
};

export default CodeRenderFrame;
