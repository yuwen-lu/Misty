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
                {designCode ? (
                    <div className="w-full h-full overflow-auto bg-white rounded-lg shadow-inner">
                        <div className="w-full h-full max-w-full max-h-full overflow-auto">
                            <LiveProvider
                                code={designCode}
                                scope={liveProviderScope}
                            >
                                <div className="w-full h-full overflow-auto">
                                    <LivePreview />
                                </div>
                                <LiveError />
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