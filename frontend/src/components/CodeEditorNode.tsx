import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import FidelityNaturalHeader from './tempComponents/FidelityNaturalHeader';
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow';



const CodeEditorNode: React.FC<NodeProps> = ({ id, data }) => {

    const editorRef = useRef(null);
    const code = data.code || 'console.log("Hello, world!");';

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


    return (
        <div className="code-editor-side-panel absolute right-0 h-full z-10 min-w-30vw flex flex-col transition-all items-center px-20 py-5 text-white bg-stone-900/70 border-2 border-stone-400">
            Hello
            <div ref={editorRef} style={{ border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
    );
};

export default CodeEditorNode;