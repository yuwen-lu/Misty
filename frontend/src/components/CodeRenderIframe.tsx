import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { transform } from '@babel/standalone';

const CodeRenderIframe: React.FC<{ code: string }> = ({ code }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            const iframe: HTMLIFrameElement = iframeRef.current;
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
                const rootDiv = iframeDoc.createElement('div');
                iframeDoc.body.appendChild(rootDiv);

                // Inject Tailwind CSS
                const tailwindLink = iframeDoc.createElement('link');
                tailwindLink.rel = 'stylesheet';
                tailwindLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css';
                iframeDoc.head.appendChild(tailwindLink);

                // Inject React and ReactDOM scripts
                const reactScript = iframeDoc.createElement('script');
                reactScript.src = 'https://unpkg.com/react@17/umd/react.production.min.js';
                reactScript.async = true;
                iframeDoc.head.appendChild(reactScript);

                const reactDomScript = iframeDoc.createElement('script');
                reactDomScript.src = 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js';
                reactDomScript.async = true;
                iframeDoc.head.appendChild(reactDomScript);

                // Wait for React and ReactDOM to load
                reactDomScript.onload = () => {
                    // Inject the component code
                    const script = iframeDoc.createElement('script');
                    script.type = 'text/babel';
                    script.text = `
                        ${code}
                        const MyComponent = window.MyComponent;
                        ReactDOM.render(
                        React.createElement(MyComponent),
                        document.body.firstChild
                        );
                    `;
                    iframeDoc.body.appendChild(script);
                };
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
