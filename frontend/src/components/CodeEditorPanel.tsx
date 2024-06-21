import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { basicDark } from '@uiw/codemirror-theme-basic';
import { LuCheck, LuEqual } from 'react-icons/lu';

const CodeEditorPanel: React.FC<{ code: string, setCode: (code: string) => void, isVisible: boolean, setCodePanelVisible: (visible: boolean) => void }> = ({ code, setCode, isVisible, setCodePanelVisible }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [panelWidth, setPanelWidth] = useState('45vw');
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (editorRef.current) {
            const startState = EditorState.create({
                doc: code,
                extensions: [
                    basicSetup,
                    javascript(),
                    basicDark,
                    EditorView.updateListener.of((update: ViewUpdate) => {
                        if (update.docChanged) {
                            setCode(update.state.doc.toString());
                        }
                    })
                ],
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
    }, [code, setCode]);

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
            className={`${isVisible ? "visible" : "invisible"} code-editor-side-panel transition-transform absolute right-0 h-full z-10 flex flex-col rounded-sm items-center p-5 text-black bg-stone-900/70 border-2 border-stone-400`}
            style={{ width: panelWidth }}
        >
            <div className='font-semibold text-white text-xl mb-5'>
                Code Editor
            </div>

            {/* Editor container with fixed height and scroll */}
            <div
                ref={editorRef}
                style={{ border: '1px solid #ccc', borderRadius: 4, flex: 1, overflow: 'auto' }}
                className='w-full'
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
                    onClick={() => setCodePanelVisible(false)}
                >
                    <LuCheck />
                    <span className='ml-2'>Done</span>
                </button>
            </div>
        </div>
    );
};

export default CodeEditorPanel;
