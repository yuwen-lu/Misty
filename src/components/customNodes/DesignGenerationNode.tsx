import React, { useEffect, useRef, useState, useCallback } from "react";
import { NodeProps, Handle, Position, NodeResizeControl } from "reactflow";
import { LuTerminal, LuEqual } from "react-icons/lu";
import { Sparkles } from "lucide-react";
import DesignRenderFrame from "./DesignRenderFrame";

const DesignGenerationNode: React.FC<NodeProps> = React.memo(
    ({ id, data, selected }) => {
        const [designCode, setDesignCode] = useState<string>(() => {
            // Return empty string initially - will be populated by generation
            return data.designCode || "";
        });
        const [isAnimating, setIsAnimating] = useState(false);
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
                    console.log("🎨 Design code received:", data.designCode);
                    setDesignCode(data.designCode);
                } catch (error) {
                    console.error("Error processing design code:", error);
                    setDesignCode("");
                }
            }
        }, [data.designCode]);

        const generateDesign = useCallback(() => {
            try {
                if (!isAnimating) {
                    setIsAnimating(true);
                }

                // Use the design context from the chat assistant
                const designContext =
                    data.designContext ||
                    "Generate a modern website design based on user preferences.";

                console.log("⚡ Starting design generation...");
                console.log("📋 Context:", designContext);

                // Call the design generation API
                data.handleDesignGeneration &&
                    data.handleDesignGeneration(
                        designContext,
                        id,
                        {} // No manual design request needed
                    );
            } catch (error) {
                console.error("Error in design generation:", error);
                setIsAnimating(false);
            }
        }, [isAnimating, data, id]);

        // Auto-start generation when node is first created
        useEffect(() => {
            if (
                !hasAutoStarted &&
                !data.designCode &&
                data.handleDesignGeneration &&
                data.designContext
            ) {
                console.log("🚀 Auto-starting design generation for node:", id);
                console.log("📋 Design context:", data.designContext);
                setHasAutoStarted(true);
                generateDesign();
            }
        }, [
            hasAutoStarted,
            data.designCode,
            data.handleDesignGeneration,
            data.designContext,
            generateDesign,
            id,
        ]);

        const createVariationNode = useCallback(async () => {
            if (!data.createNewDesignNode || !data.designContext) return;

            try {
                // Create a new design generation node with the same context
                data.createNewDesignNode(data.designContext);
            } catch (error) {
                console.error("Error creating variation node:", error);
            }
        }, [data]);

        const regenerateDesign = useCallback(() => {
            console.log("🔄 Regenerating design...");
            // Clear current design code to show loading state
            setDesignCode("");
            // Call the same generation function
            generateDesign();
        }, [generateDesign]);

        return (
            <div
                className={`flex flex-col px-5 py-3 
            text-white bg-purple-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg 
                border-t-8 border-t-purple-900
            w-full h-full overflow-hidden
            transition-shadow duration-300 ease-in-out ${selected ? "shadow-2xl ring-4 ring-purple-500 ring-opacity-50" : ""}`}
                style={{
                    width: "1280px",
                    height: "800px",
                }}
            >
                <div
                    className="design-generation-container flex flex-col w-full h-full"
                    ref={nodeRef}
                >
                    {/* Header */}
                    <div className="w-full flex relative mb-4">
                        <div className="text-purple-900 font-semibold text-xl">
                            Design Generation
                        </div>
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
                    <div className="flex flex-row justify-end gap-3 mt-4">
                        <button
                            className={`flex items-center rounded-lg px-4 py-2 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900`}
                            onClick={() => {
                                if (!data.codePanelVisible) {
                                    data.setDisplayCode &&
                                        data.setDisplayCode(designCode);
                                } else {
                                    data.setDisplayCode &&
                                        data.setDisplayCode("");
                                }
                                data.toggleCodePanelVisible &&
                                    data.toggleCodePanelVisible();
                            }}
                        >
                            <LuTerminal size={16} />
                            <span className="ml-2">
                                {data.codePanelVisible ? "Hide" : "Show"} Code
                            </span>
                        </button>

                        <button
                            className="flex items-center rounded-lg px-4 py-2 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"
                            onClick={regenerateDesign}
                        >
                            <Sparkles size={16} />
                            <span className="ml-2">Regenerate</span>
                        </button>

                        {/* <button
                            className="flex items-center rounded-lg px-4 py-2 text-white font-semibold focus:outline-none bg-zinc-700 hover:bg-zinc-900"
                            onClick={createVariationNode}
                        >
                            <Sparkles size={16} />
                            <span className="ml-2">Generate variation (+💎)</span>
                        </button> */}
                    </div>

                    {/* Resize Control */}
                    <NodeResizeControl
                        style={{ background: "transparent", border: "none" }}
                        minWidth={1280}
                        minHeight={800}
                    >
                        <div
                            style={{
                                color: "#ddd",
                                position: "absolute",
                                right: 7,
                                bottom: 5,
                                visibility: selected ? "visible" : "hidden",
                            }}
                        >
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
                            width: "10px",
                            height: "10px",
                            borderRadius: "5px",
                            borderWidth: "2px",
                            borderColor: "white",
                            borderStyle: "solid",
                            marginLeft: "-5px",
                        }}
                        className="bg-purple-900 opacity-50"
                    />
                </div>
            </div>
        );
    }
);

export default DesignGenerationNode;
