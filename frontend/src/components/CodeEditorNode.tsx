import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import FidelityNaturalHeader from './tempComponents/FidelityNaturalHeader';

const CodeEditorNode = () => {

    return (
        <div className="code-editor-side-panel absolute right-0 h-full z-10 min-w-30vw flex flex-col transition-all items-center px-20 py-5 text-white bg-stone-900/70 border-2 border-stone-400">
            Hello            
        </div>
    );
};

export default CodeEditorNode;
