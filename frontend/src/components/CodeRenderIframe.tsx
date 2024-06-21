import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { transform } from '@babel/standalone';

const CodeRenderIframe: React.FC<{ code: string }> = ({ code }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

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

                // Transform the code using Babel
                const transformedCode = transform(code, {
                    presets: ['react', 'es2015']
                }).code;

                // Create a new script element and append the transformed code
                const script = iframeDocument.createElement('script');
                script.type = 'text/javascript';
                script.textContent = `
                    (function() {
                        ${transformedCode}
                        const Component = window.FidelityNaturalHeader;
                        const root = window.ReactDOM.createRoot(document.getElementById('root'));
                        root.render(React.createElement(Component));
                    })();
                `;
                iframeDocument.body.appendChild(script);

                // Make React and ReactDOM available in the iframe context
                const reactScript = iframeDocument.createElement('script');
                reactScript.src = 'https://unpkg.com/react@17/umd/react.development.js';
                reactScript.onload = () => {
                    const reactDomScript = iframeDocument.createElement('script');
                    reactDomScript.src = 'https://unpkg.com/react-dom@17/umd/react-dom.development.js';
                    reactDomScript.onload = () => {
                        iframeDocument.body.appendChild(script);
                    };
                    iframeDocument.body.appendChild(reactDomScript);
                };
                iframeDocument.body.appendChild(reactScript);
            }
        }
    }, [code]);

    return (
        <div className="iframe-container grow w-full">
            <iframe
                ref={iframeRef}
                className="rounded-md"
                title="Tailwind iframe"
                style={{ width: '100%', height: '100%', minWidth: '345px', minHeight: '740px', border: 'none' }}
            />
        </div>
    );
};

export default CodeRenderIframe;
