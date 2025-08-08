import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NodeProps, Handle, Position, NodeResizeControl } from 'reactflow';
import { LuTerminal, LuEqual } from 'react-icons/lu';
import { Sparkles, RefreshCw } from 'lucide-react';
import DesignRenderFrame from './DesignRenderFrame';
import { defaultBoundingBox, loadingIdState } from '../../util';

const DesignGenerationNode: React.FC<NodeProps> = React.memo(({ id, data, selected }) => {
    const [designCode, setDesignCode] = useState<string>(() => {
        // Return empty string initially - will be populated by generation
        return data.designCode || '';
    });
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [hasAutoStarted, setHasAutoStarted] = useState(false);

    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAnimating) {
            timer = setTimeout(() => setIsAnimating(false), 500);
        }
        return () => clearTimeout(timer);
    }, [isAnimating]);

    // Update design code when received from API
    useEffect(() => {
        if (data.designCode && data.designCode !== designCode) {
            try {
                console.log('🎨 Design code received:', data.designCode);
                setDesignCode(data.designCode);
                setHasGenerated(true);
            } catch (error) {
                console.error('Error processing design code:', error);
                setDesignCode('');
                setHasGenerated(false);
            }
        }
    }, [data.designCode]);

    const generateDesign = useCallback(() => {
        try {
            if (!isAnimating) {
                setIsAnimating(true);
            }
            
            // Use the design context from the chat assistant
            const designContext = data.designContext || "Generate a modern website design based on user preferences.";
            
            console.log('⚡ Starting design generation...');
            console.log('📋 Context:', designContext);
            
            // Call the design generation API
            data.handleDesignGeneration && data.handleDesignGeneration(
                designContext,
                id,
                {} // No manual design request needed
            );
        } catch (error) {
            console.error('Error in design generation:', error);
            setIsAnimating(false);
        }
    }, [isAnimating, data, id]);

    // Auto-start generation when node is first created
    useEffect(() => {
        if (!hasAutoStarted && !data.designCode && data.handleDesignGeneration && data.designContext) {
            console.log('🚀 Auto-starting design generation for node:', id);
            console.log('📋 Design context:', data.designContext);
            setHasAutoStarted(true);
            generateDesign();
        }
    }, [hasAutoStarted, data.designCode, data.handleDesignGeneration, data.designContext, generateDesign, id]);

    const regenerateDesign = useCallback(() => {
        setHasGenerated(false);
        generateDesign();
    }, [generateDesign]);

    return (
        <div className={`flex flex-col px-5 py-3 
            text-white bg-purple-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg 
                border-t-8 border-t-purple-900
            w-full h-full overflow-hidden
            transition-shadow duration-300 ease-in-out ${selected ? 'shadow-2xl ring-4 ring-purple-500 ring-opacity-50' : ''}`}
            style={{
                width: '1280px',
                height: '800px'
            }}>
            
            <div
                className="design-generation-container flex flex-col w-full h-full"
                ref={nodeRef}
            >
                {/* Header */}
                <div className='w-full flex relative mb-4'>
                    <div className='text-purple-900 font-semibold text-xl'>
                        Design Generation
                    </div>

                    {/* Only show Regenerate button after generation is complete */}
                    {hasGenerated && (
                        <div className='ml-auto'>
                            <button
                                className='flex items-center space-x-2 font-normal text-sm text-purple-900 px-3 py-1 rounded bg-white/10 hover:bg-white/20'
                                onClick={regenerateDesign}>
                                <RefreshCw className={`transition-all duration-1500 ease-in-out ${isAnimating ? 'animate-spin' : ''}`} size={16} />
                                <span>Regenerate</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Design Preview - takes remaining height */}
                <div className="flex-1 w-full overflow-hidden">
                    <DesignRenderFrame
                        nodeId={id}
                        response={data.response || ""}
                        designCode={designCode}
                        loadingStates={data.loadingStates || []}
                        updateLoadingState={data.updateLoadingState}
                        abortController={data.abortController}
                    />
                </div>

                {/* Action Buttons */}
                <div className='flex flex-row justify-end gap-3 mt-4'>
                    <button
                        className={`flex items-center rounded-lg px-4 py-2 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900`}
                        onClick={() => {
                            if (!data.codePanelVisible) {
                                data.setDisplayCode && data.setDisplayCode(designCode);
                            } else {
                                data.setDisplayCode && data.setDisplayCode("");
                            }
                            data.toggleCodePanelVisible && data.toggleCodePanelVisible();
                        }}
                    >
                        <LuTerminal size={16} />
                        <span className='ml-2'>{data.codePanelVisible ? "Hide" : "Show"} Code</span>
                    </button>
                </div>

                {/* Resize Control */}
                <NodeResizeControl style={{ background: 'transparent', border: 'none' }} minWidth={1280} minHeight={800}>
                    <div style={{ color: "#ddd", position: 'absolute', right: 7, bottom: 5, visibility: selected ? "visible" : "hidden" }}>
                        <LuEqual />
                    </div>
                </NodeResizeControl>

                {/* Connection Handle */}
                <Handle
                    type="target"
                    position={Position.Left}
                    id="design-t"
                    isConnectable={true}
                    style={{
                        width: '20px',
                        height: '60px',
                        borderRadius: '5px',
                        borderWidth: '2px',
                        borderColor: 'white',
                        borderStyle: 'solid',
                        marginLeft: '-5px',
                    }}
                    className="bg-purple-900 opacity-50"
                />
            </div>
        </div>
    );
});

export default DesignGenerationNode;