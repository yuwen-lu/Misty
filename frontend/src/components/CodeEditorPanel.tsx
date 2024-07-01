import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { indentUnit } from "@codemirror/language";
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { LuCheck, LuEqual } from 'react-icons/lu';

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const CodeEditorPanel: React.FC<{ code: string, setCode: (code: string) => void, isVisible: boolean, setCodePanelVisible: (visible: boolean) => void }> = ({ code, setCode, isVisible, setCodePanelVisible }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [panelWidth, setPanelWidth] = useState('45vw');
    const [isResizing, setIsResizing] = useState(false);

    const debouncedSetCode = debounce((newCode: string) => {
        setCode(newCode);
    }, 300);

    // Initialize the editor view once
    useEffect(() => {
        if (editorRef.current && !viewRef.current) {
            const startState = EditorState.create({
                doc: code,
                extensions: [
                    basicSetup,
                    javascript(),
                    vscodeDark,
                    EditorState.changeFilter.of((tr) => {
                        if (tr.docChanged) {
                            debouncedSetCode(tr.newDoc.toString());
                        }
                        return true; // Allow all changes
                    }),
                    indentUnit.of("    ")
                ],
            });

            viewRef.current = new EditorView({
                state: startState,
                parent: editorRef.current,
            });

            console.log('EditorView initialized');

            // Cleanup the view on unmount
            return () => {
                console.log('Destroying EditorView');
                viewRef.current?.destroy();
                viewRef.current = null;
            };
        }
    }, []);

    // Update the editor content when code changes
    useEffect(() => {
        if (viewRef.current) {
            const updateTransaction = viewRef.current.state.update({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: code,
                },
            });

            viewRef.current.dispatch(updateTransaction);
            debouncedSetCode(code);
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
