import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import FidelityNaturalHeader from './tempComponents/FidelityNaturalHeader';
import { LuCheck, LuChevronsLeftRight, LuEqual, LuGripVertical } from 'react-icons/lu';

const CodeEditorPanel: React.FC<{ code: string, setCode: (code: string) => void, isVisible: boolean, setCodePanelVisible: (visible: boolean) => void }> = ({ code, setCode, isVisible, setCodePanelVisible }) => {
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
            className={`${isVisible ? "visible" : "invisible"} code-editor-side-panel transition-transform absolute right-0 h-full z-10 flex flex-col rounded-sm items-center p-5 text-white bg-stone-900/70 border-2 border-stone-400`}
            style={{ width: panelWidth }}
        >
            <div className='font-semibold text-xl mb-5'>
                Code Editor
            </div>

            {/* TODO for Editor, when code changes, propogate code change back to app.tsx */}
            <div
                ref={editorRef}
                style={{ border: '1px solid #ccc', borderRadius: 4 }}
                className='h-full w-full'
            />
            <div
                className="resize-handle flex flex-col justify-center"
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

            >
                <div className='origin-center rotate-90 ml-2'>
                    <LuEqual size={20} color='#ddd' />
                </div>
            </div>

            <div className='flex flex-row'>
                <button
                    className={"flex items-center rounded-lg mt-6 mx-2 px-5 py-3 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"}
                    onClick={
                        () => {
                            setCodePanelVisible(false);
                        }
                    }
                >
                    <LuCheck />
                    <span className='ml-2'>Done</span>
                </button>
            </div>
        </div >
    );
};

export default CodeEditorPanel;
