import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import FidelityNaturalHeader from './tempComponents/FidelityNaturalHeader';

const CodeEditorPanel: React.FC<{ code: string, isVisible: boolean }> = ({ code, isVisible }) => {
    const editorRef = useRef(null);
    const [panelWidth, setPanelWidth] = useState('30vw');
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (editorRef.current) {
            const startState = EditorState.create({
                doc: code,
                extensions: [basicSetup, javascript()],
            });

            const view = new EditorView({
                state: startState,
                parent: editorRef.current,
            });

            // Cleanup the view on unmount
            return () => {
                view.destroy();
            };
        }
    }, [code]);

    const startResizing = () => {
        setIsResizing(true);
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            setPanelWidth(`${newWidth}px`);
        }
    };
    
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);
    
    return (
        <div
            className={`${isVisible ? "visible" : "invisible"} code-editor-side-panel absolute right-0 h-full z-10 flex flex-col rounded-lg items-center p-5 text-white bg-stone-900/70 border-2 border-stone-400`}
            style={{ width: panelWidth }}
        >
            <div className='font-semibold text-xl mb-5'>
                Code Editor
            </div>

            <div
                ref={editorRef}
                style={{ border: '1px solid #ccc', borderRadius: 4 }}
                className='h-full w-full'
            />
            <div
                className="resize-handle"
                onMouseDown={startResizing}
                style={{
                    width: '10px',
                    cursor: 'ew-resize',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: 'transparent',
                }}
            />
        </div>
    );
};

export default CodeEditorPanel;
