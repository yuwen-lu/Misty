import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import FidelityNaturalHeader from './tempComponents/FidelityNaturalHeader';

const CodeRenderIframe = () => {
    const iframeRef = useRef(null);

    useEffect(() => {

        if (iframeRef.current) {
            const iframe: HTMLIFrameElement = iframeRef.current;
            const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDocument) {
                // Inject Tailwind CSS into the iframe
                const link = iframeDocument.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
                iframeDocument.head.appendChild(link);

                // Render React component into iframe
                const mountNode = iframeDocument.createElement('div');
                iframeDocument.body.appendChild(mountNode);
                const root = createRoot(mountNode);
                root.render(<FidelityNaturalHeader />);
            }
        }


    }, []);

    return (
        <div className="iframe-container grow w-full">
            <iframe
                ref={iframeRef}
                className='rounded-md'
                title="Tailwind iframe"
                style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '750px',  border: 'none' }} />
        </div>
    );
};

export default CodeRenderIframe;
