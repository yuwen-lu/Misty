import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { indentUnit } from "@codemirror/language";
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { LuCheck, LuEqual, LuSave } from 'react-icons/lu';


function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// used for show a saved popup
const SavePopup: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
    <div className={`absolute inset-0 flex items-center justify-center z-50 transition-all duration-200 ease-in-out ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}>
        <div className={`bg-gray-800 backdrop-filter backdrop-blur-sm rounded-lg p-6 shadow-lg transition-all duration-200 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="flex items-center justify-center text-white">
                <LuSave className="mr-3 text-3xl" />
                <span className="text-xl font-semibold">Changes Saved!</span>
            </div>
        </div>
    </div>
);

interface CodeEditorPanelProps {
    code: string;
    setCode: (code: string) => void;
    isVisible: boolean;
    setCodePanelVisible: (visible: boolean) => void;
}


const CodeEditorPanel: React.FC<CodeEditorPanelProps> = React.memo(({ code, setCode, isVisible, setCodePanelVisible }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const codeRef = useRef(code);
    const [panelWidth, setPanelWidth] = useState('45vw');
    const [isResizing, setIsResizing] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);

    const debouncedSetCode = useCallback(
        debounce((newCode: string) => {
            setCode(newCode);
        }, 300),
        [setCode]
    );


    // when the user press cmd+s, we handle the save event by re-render the code and show a popup
    const handleSave = useCallback(() => {
        const newCode = viewRef.current?.state.doc.toString() || '';
        setCode(newCode);
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 800); // Hide popup after 2 seconds
    }, [setCode]);

    // Initialize the editor view once
    useEffect(() => {
        if (editorRef.current && !viewRef.current) {
            const startState = EditorState.create({
                doc: codeRef.current,
                extensions: [
                    basicSetup,
                    javascript(),
                    vscodeDark,
                    EditorState.changeFilter.of((tr) => {
                        if (tr.docChanged) {
                            const newCode = tr.newDoc.toString();
                            codeRef.current = newCode;
                            debouncedSetCode(newCode);
                        }
                        return true; // Allow all changes
                    }),
                    indentUnit.of("    "),
                    keymap.of([
                        ...defaultKeymap,
                        indentWithTab,
                        {
                            key: "Mod-s",
                            run: () => {
                                handleSave();
                                return true;
                            },
                            preventDefault: true
                        }
                    ]),
                    EditorView.domEventHandlers({
                        keydown: (event) => {
                            if (event.key === 'Tab') {
                                event.preventDefault();
                            }
                        }
                    })
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

    // Update the editor content when code prop changes
    useEffect(() => {
        if (viewRef.current && code !== codeRef.current) {
            const updateTransaction = viewRef.current.state.update({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: code,
                },
            });

            viewRef.current.dispatch(updateTransaction);
            codeRef.current = code;
        }
    }, [code]);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            setPanelWidth(`${newWidth}px`);
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div
            className={`${isVisible ? "visible" : "invisible"} code-editor-side-panel transition-transform absolute right-0 h-full z-10 flex flex-col rounded-sm items-center p-5 text-black bg-stone-900/70 border-2 border-stone-400`}
            style={{ width: panelWidth }}
        >
            <div className='font-semibold text-white text-xl mb-5'>
                Code Editor
            </div>

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
            <SavePopup isVisible={showSavePopup} />
        </div>
    );
});

export default CodeEditorPanel;