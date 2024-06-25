import React, { useEffect, useRef, useState, ReactElement } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';

const CodeRenderIframe: React.FC<{ code: string }> = ({ code }) => {

    return (
        <div className="iframe-container grow w-full">
            {/* <iframe
                ref={iframeRef}
                className="rounded-md"
                title="Tailwind iframe"
                style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
            /> */}
            <LiveProvider code={code} scope={{ ...LuIcons }}>
                <LivePreview />
                <LiveError />
            </LiveProvider>
        </div>
    );
};

export default CodeRenderIframe;
