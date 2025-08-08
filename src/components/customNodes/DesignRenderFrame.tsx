import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as LuIcons from 'react-icons/lu';
import { BoundingBox, defaultBoundingBox, loadingIdState } from '../../util';

interface DesignRenderFrameProps {
    nodeId: string;
    response: string;
    designCode: string;
    loadingStates: loadingIdState[];
    updateLoadingState: (targetId: string, newState: boolean) => void;
    abortController: AbortController | null;
}

const DesignRenderFrame: React.FC<DesignRenderFrameProps> = ({ 
    nodeId, 
    response, 
    designCode, 
    loadingStates, 
    updateLoadingState, 
    abortController 
}) => {
    const [renderError, setRenderError] = useState<string | null>(null);
    const cancelGeneration = useCallback(() => {
        updateLoadingState(nodeId, false);
        abortController && abortController.abort();
    }, [nodeId, updateLoadingState, abortController]);

    const isLoading = useMemo(() => {
        const currentNodeState = loadingStates.find(items => items.id === nodeId);
        return currentNodeState?.loading || false;
    }, [loadingStates, nodeId]);

    const liveProviderScope = useMemo(() => ({
        React, 
        useState: React.useState,
        ...LuIcons
    }), []);

    const safeDesignCode = useMemo(() => {
        if (!designCode) return '';
        
        try {
            // Reset render error when processing new code
            setRenderError(null);
            
            // Basic validation - check for syntax issues
            const codeValidation = [
                { pattern: /\bimport\s+/, message: "Import statements are not allowed in live code" },
                { pattern: /\bexport\s+/, message: "Export statements are not allowed in live code" },
                { pattern: /\brequire\s*\(/, message: "Require statements are not allowed in live code" },
            ];
            
            for (const validation of codeValidation) {
                if (validation.pattern.test(designCode)) {
                    setRenderError(validation.message);
                    return '';
                }
            }
            
            // Enhanced JSON error handling
            if (designCode.includes('JSON.parse') || designCode.includes('JSON.stringify')) {
                return designCode.replace(
                    /JSON\.(parse|stringify)\([^)]+\)/g, 
                    (match) => `(() => { try { return ${match}; } catch (e) { console.error('JSON parsing error:', e); return null; } })()`
                );
            }
            
            return designCode;
        } catch (error) {
            console.error('Error processing design code:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setRenderError(`Code processing error: ${errorMessage}`);
            return '';
        }
    }, [designCode]);

    return (
        <div className="code-render-container w-full h-full overflow-hidden relative">
            {/* Loading overlay */}
            <div className={`spinner-wrapper z-50 ${isLoading ? "visible" : "invisible"}`}>
                <div className={`spinner ${isLoading ? 'animate-spin' : ''}`}></div>
                <div className={`spinner inner ${isLoading ? 'animate-spin-reverse' : ''}`}></div>
                <div className='flex items-center w-full'>
                    <button
                        className="mt-12 mx-auto px-4 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-900 focus:outline-none"
                        onClick={cancelGeneration}>
                        Cancel
                    </button>
                </div>
            </div>

            {/* Streaming response display */}
            <div className={`absolute w-full h-full text-purple-400/80 ${isLoading ? "visible text-glow" : "invisible"}`}>
                {isLoading ? (response.length > 2000 ? response.slice(response.length - 2000) : response) : ""}
            </div>

            {/* Design preview */}
            <div className={`${isLoading ? "invisible" : ""} w-full h-full`}>
                {renderError ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-inner">
                        <div className="text-center p-6 max-w-md">
                            <div className="text-6xl mb-4">🛠️</div>
                            <div className="text-xl font-bold text-red-700 mb-3">Oops! Something went wrong</div>
                            <div className="text-sm text-red-600 bg-white/70 rounded-lg p-3 mb-4 font-mono text-left whitespace-pre-wrap border border-red-200">
                                {renderError}
                            </div>
                            <div className="text-xs text-gray-600 mb-4">
                                Don't worry, this happens! Try regenerating the design or check the code for syntax issues.
                            </div>
                            <button 
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm hover:from-red-700 hover:to-red-800 shadow-md transition-all duration-200 transform hover:scale-105"
                                onClick={() => setRenderError(null)}
                            >
                                🔄 Try Again
                            </button>
                        </div>
                    </div>
                ) : safeDesignCode ? (
                    <div className="w-full h-full overflow-auto bg-white rounded-lg shadow-inner">
                        <div className="w-full h-full max-w-full max-h-full overflow-auto">
                            <LiveProvider
                                code={safeDesignCode}
                                scope={liveProviderScope}
                                onError={(error) => {
                                    console.error('LiveProvider error:', error);
                                    setRenderError(`Render error: ${error.toString()}`);
                                }}
                            >
                                <div className="w-full h-full overflow-auto">
                                    <LivePreview />
                                </div>
                                {/* Custom styled error display */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <LiveError 
                                        className="bg-red-50 border border-red-200 rounded-lg p-4 m-2 text-red-800 text-sm font-mono whitespace-pre-wrap shadow-lg"
                                        style={{
                                            display: 'block',
                                            backgroundColor: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            margin: '8px',
                                            color: '#991b1b',
                                            fontSize: '14px',
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                            pointerEvents: 'auto'
                                        }}
                                    />
                                </div>
                            </LiveProvider>
                        </div>
                    </div>
                ) : (
                    /* Empty state - no design code yet and not loading */
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg shadow-inner">
                        <div className="text-center text-gray-400">
                            <div className="text-lg font-medium mb-2">Design Generation</div>
                            <div className="text-sm">Initializing...</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesignRenderFrame;