import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    Connection,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    NodeTypes,
    DefaultEdgeOptions,
    useReactFlow,
    useViewport,
    SelectionMode,
} from "reactflow";
import ImageDisplayNode from "./customNodes/ImageDisplayNode";
import ImageUploadNode from "./customNodes/ImageUploadNode";
import ExplanationNode from "./customNodes/ExplanationNode";
import CodeRenderNode from "./customNodes/CodeRenderNode";
import SubImageNode from "./customNodes/SubImageNode";
import ConfirmationPopupNode from "./customNodes/ConfirmationPopupNode";
import DynamicUI from "./customNodes/DynamicUI";
import WebsitePreviewNode from "./customNodes/WebsitePreviewNode";
import FontNode from "./customNodes/FontNode";
import TextInstructionNode from "./customNodes/TextInstructionNode";
import DesignNotesNode from "./customNodes/DesignNotesNode";
import { addDesignNote } from '../utils/userInteractionStorage';
import DesignCritiqueNode from "./customNodes/DesignCritiqueNode";
import DesignGenerationNode from "./customNodes/DesignGenerationNode";
import CodeEditorPanel from "./CodeEditorPanel";
import { ChatPanel } from "./chat/ChatPanel";
import { Models } from "./chat/ChatInput";
import { useCoins } from "../contexts/CoinContext";
import InitialChatDialog from "./chat/InitialChatDialog";
import { WebPreviewNodeData, FontNodeData, TextInstructionNodeData } from "./chat/ChatMessage";
import { useChat } from "../contexts/ChatContext";

import {
    removeEscapedChars,
    coordinatePositionType,
    BoundingBox,
    defaultBoundingBox,
    formatCode,
    loadingIdState,
    codeRenderNodeContent,
} from "../util";
import {
    safeParseResponse,
    constructTextPrompt,
    parseReplacementPromptResponse,
    CodeChange,
    ParsedData,
    ParsedGlobalBlendingData,
    Change,
    CategorizedChange,
} from "../prompts";
import ErrorPopup from "./ErrorPopup";
import DesignFeedbackPopup from "./DesignFeedbackPopup";
import WebInspectionGuidePopup from "./WebInspectionGuidePopup";
import { BookList } from "./renderCode/BookList";
import ButtonEdge from "./ButtonEdge";

const nodeTypes: NodeTypes = {
    imageUploadNode: ImageUploadNode,
    imageDisplayNode: ImageDisplayNode,
    subimageNode: SubImageNode,
    explanationNode: ExplanationNode,
    codeRenderNode: CodeRenderNode,
    confirmationPopupNode: ConfirmationPopupNode,
    websitePreviewNode: WebsitePreviewNode,
    fontNode: FontNode,
    textInstructionNode: TextInstructionNode,
    designNotesNode: DesignNotesNode,
    designCritiqueNode: DesignCritiqueNode,
    designGenerationNode: DesignGenerationNode,
};

const edgeTypes = {
    button: ButtonEdge,
};

const initialNodes: Node[] = [
    {
        id: "initial-instruction",
        type: "textInstructionNode",
        position: { x: 150, y: 100 },
        data: { 
            title: "How This Canvas Works",
            instructions: [
                "Use the chat to describe your design",
                "Interact with canvas to earn 💎",
                "Accumulate 💎 to unlock next steps"
            ]
        },
    },
];

const initialEdges: Edge[] = [];

const initialConfirmationPopupNodeDataPackage = {
    mousePosition: {
        x: 0,
        y: 0,
    },
    subImageScreenshot: "",
    sourceNodeId: "",
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
};

const initialCodeToRender: codeRenderNodeContent[] = [];

const fetchResponseUrl = process.env.REACT_APP_DEPLOYMENT_BACKEND_URL
    ? `${process.env.REACT_APP_DEPLOYMENT_BACKEND_URL}/api/chat`
    : "/api/chat";


const FlowComponent: React.FC = () => {
    const { coins } = useCoins();
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [isDragging, setIsDragging] = useState(false); // when we drag subimagenode (washi tape)
    const [
        newConfirmationPopupNodeDataPackage,
        setNewConfirmationPopupNodeDataPackage,
    ] = useState(initialConfirmationPopupNodeDataPackage);
    const [codePanelVisible, setCodePanelVisible] = useState<boolean>(false);
    const [renderCodeContentList, setRenderCodeContentListState] =
        useState<codeRenderNodeContent[]>(initialCodeToRender);
    const [displayCode, setDisplayCode] = useState<string>(""); // for the edit code panel

    // the below states are used to know what code is being blended, i.e. used in the api call. but ideally they should be managed as an object, maybe using redux, to avoid conflicted user operations
    const [targetBlendCode, setTargetBlendCode] = useState<string>(""); // for the code to be blended
    const [targetCodeDropped, setTargetCodeDropped] = useState<string>("");
    const [targetRenderCodeNodeBbox, setTargetRenderCodeNodeBbox] =
        useState<BoundingBox | null>(null);
    const [targetCodeRenderNodeId, setTargetCodeRenderNodeId] =
        useState<string>("");

    const { x, y, zoom } = useViewport();
    const { fitView, setCenter, setViewport } = useReactFlow();
    const [response, setResponse] = useState("");
    const [loadingStates, setLoadingStates] = useState<loadingIdState[]>([]);
    const [showError, setShowError] = useState(false);

    // abort api calls when the user cancels it
    const [abortController, setAbortController] =
        useState<AbortController | null>(null);

    // Chat interface states
    const [showInitialDialog, setShowInitialDialog] = useState(true);
    const [showChatInterface, setShowChatInterface] = useState(false);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [initialMessage, setInitialMessage] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<Models>(Models.claudeSonnet4);
    
    // Chat context for diamond menu integration
    const { registerChatHandler } = useChat();
    
    // Design feedback states
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    const [currentFeedbackNodeId, setCurrentFeedbackNodeId] = useState<string>('');
    const [currentFeedbackUrl, setCurrentFeedbackUrl] = useState<string>('');
    
    // Web inspection guide states
    const [showInspectionGuide, setShowInspectionGuide] = useState(false);
    const [inspectionCallback, setInspectionCallback] = useState<(() => void) | null>(null);
    

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    const toggleCodePanelVisible = () => {
        setCodePanelVisible(!codePanelVisible);
    };

    // Chat interface handlers
    const handleStartChat = (message: string, model: 'claude-sonnet' | 'claude-opus') => {
        setInitialMessage(message);
        setSelectedModel(model === 'claude-opus' ? Models.claudeOpus4 : Models.claudeSonnet4);
        setShowInitialDialog(false);
        setShowChatInterface(true);
        setIsChatMinimized(false);
    };

    const handleCloseInitialDialog = () => {
        setShowInitialDialog(false);
    };

    const handleToggleChatMinimize = useCallback(() => {
        setIsChatMinimized(prev => !prev);
    }, []);

    // Handler for diamond menu chat messages
    const handleDiamondMenuMessage = useCallback((message: string) => {
        // Generate a unique key to force re-render of ChatPanel
        const messageWithTimestamp = `${message}__${Date.now()}`;
        setInitialMessage(messageWithTimestamp);
        setSelectedModel(Models.claudeSonnet4);
        setShowInitialDialog(false);
        setShowChatInterface(true);
        setIsChatMinimized(false);
    }, []);

    // Register chat handler for diamond menu
    useEffect(() => {
        registerChatHandler(handleDiamondMenuMessage);
    }, [registerChatHandler, handleDiamondMenuMessage]);

    // Design feedback handlers
    const handleShowFeedbackPopup = (nodeId: string, websiteUrl: string) => {
        setCurrentFeedbackNodeId(nodeId);
        setCurrentFeedbackUrl(websiteUrl);
        setShowFeedbackPopup(true);
    };

    const handleFeedbackSubmit = (feedback: { notes: string }) => {
        // Create notes node connected to the WebPreview node
        createDesignNotesNode(currentFeedbackNodeId, currentFeedbackUrl, feedback);
        setShowFeedbackPopup(false);
        setCurrentFeedbackNodeId('');
        setCurrentFeedbackUrl('');
    };

    const handleFeedbackClose = () => {
        setShowFeedbackPopup(false);
        setCurrentFeedbackNodeId('');
        setCurrentFeedbackUrl('');
    };

    // Web inspection guide handlers
    const handleShowInspectionGuide = (onConfirm: () => void) => {
        setInspectionCallback(() => onConfirm);
        setShowInspectionGuide(true);
    };

    const handleInspectionGuideClose = () => {
        setShowInspectionGuide(false);
        setInspectionCallback(null);
    };

    const handleInspectionGuideConfirm = () => {
        setShowInspectionGuide(false);
        if (inspectionCallback) {
            inspectionCallback();
        }
        setInspectionCallback(null);
    };

    // Simple function to center canvas view on a position
    const handleCenterOnPosition = useCallback((x: number, y: number) => {
        console.log('🎯 Centering canvas view on position:', { x, y });
        
        try {
            // Use setCenter with zoom out for better overview
            setCenter(x, y, { zoom: 0.35, duration: 1000 });
            console.log('✅ setCenter called');
        } catch (error) {
            console.error('❌ setCenter failed:', error);
        }
    }, [setCenter]);

    // Function to search for URLs using Brave Search API
    const searchForWebsiteUrl = async (query: string): Promise<string | null> => {
        try {
            const response = await fetch('/api/brave-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, count: 1 })
            });

            if (!response.ok) {
                console.error('❌ Brave search failed:', response.status);
                return null;
            }

            const data = await response.json();
            const firstResult = data.results?.[0];
            
            if (firstResult?.url) {
                return firstResult.url;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error searching for URL:', error);
            return null;
        }
    };

    // Global tracker for next available position to prevent overlaps
    const nextWebPreviewPosition = React.useRef({ x: 600, y: 200 });
    // Global tracker for column position (0 or 1 for two columns)
    const currentColumn = React.useRef(0);
    // Function to create DesignGenerationNode
    const createDesignGenerationNode = useCallback((onNodeCreated?: (x: number, y: number) => void, designContext?: string) => {
        const nodeId = `design-generation-${Date.now()}`;
        const position = { x: 400, y: 200 };
        
        const newNode: Node = {
            id: nodeId,
            type: 'designGenerationNode',
            position,
            data: {
                designCode: '',
                response: '',
                designContext: designContext || '', // Pass the design context from the assistant
            }
        };
        
        setNodes((prevNodes) => [...prevNodes, newNode]);
        
        // Center view on the new node
        if (onNodeCreated) {
            setTimeout(() => {
                onNodeCreated(position.x + 300, position.y + 400);
            }, 100);
        }
        
        return nodeId;
    }, []);

    // Function to create WebPreviewNodes from chat API responses
    const createWebPreviewNodes = useCallback(async (webPreviewNodesData: WebPreviewNodeData[], onFirstNodeCreated?: (x: number, y: number) => void, nodeIds?: string[]) => {
        
        const newNodes: Node[] = [];
        const nodeWidth = 1280; // Match default WebsitePreviewNode width
        const nodeHeight = 950; // Increased to accommodate header and controls
        const horizontalSpacing = 700; // Increased space to accommodate notes nodes
        const verticalSpacing = 250; // Space between rows

        let firstNodePosition: { x: number, y: number } | null = null;

        // Process each node and search for the correct URL
        for (let index = 0; index < webPreviewNodesData.length; index++) {
            const webPreviewData = webPreviewNodesData[index];
            
            // Use provided nodeId or generate one if not provided (fallback)
            const nodeId = nodeIds?.[index] || `web-preview-${Date.now()}-${index}`;
            const positionX = nextWebPreviewPosition.current.x + currentColumn.current * (nodeWidth + horizontalSpacing);
            const positionY = nextWebPreviewPosition.current.y;
            
            // Record the first node position
            if (index === 0) {
                firstNodePosition = { x: positionX + nodeWidth / 2, y: positionY + nodeHeight / 2 };
            }
            
            console.log(`Creating WebPreview node ${index}: column=${currentColumn.current}, x=${positionX}, y=${positionY}`);
            

            // Extract search query from the original URL or use it directly
            let searchQuery = webPreviewData.parameters.url;
            let finalUrl = webPreviewData.parameters.url;

            // If the URL looks like a search query (no protocol), search for it
            if (!webPreviewData.parameters.url.startsWith('http')) {
                const searchResult = await searchForWebsiteUrl(searchQuery);
                if (searchResult) {
                    finalUrl = searchResult;
                } else {
                    // Fallback: try to make it a proper URL
                    finalUrl = `https://${webPreviewData.parameters.url}`;
                }
            }


            newNodes.push({
                id: nodeId,
                type: "websitePreviewNode",
                draggable: true,
                position: { x: positionX, y: positionY },
                data: { 
                    url: finalUrl,
                    originalQuery: webPreviewData.parameters.url,
                    onUrlChange: (nodeId: string, newUrl: string) => {
                        setNodes((nds) =>
                            nds.map((node) =>
                                node.id === nodeId
                                    ? { ...node, data: { ...node.data, url: newUrl } }
                                    : node
                            )
                        );
                    },
                    onShowFeedbackPopup: handleShowFeedbackPopup,
                    onShowInspectionGuide: handleShowInspectionGuide,
                    onGenerateCritique: handleGenerateCritique
                },
                style: { width: nodeWidth, height: nodeHeight },
            });

            // Update global column and position trackers
            currentColumn.current = (currentColumn.current + 1) % 2; // Alternate between 0 and 1
            
            // If we completed a row (back to column 0), move to next row
            if (currentColumn.current === 0) {
                nextWebPreviewPosition.current.y += nodeHeight + verticalSpacing;
                console.log(`Moving to next row: new y=${nextWebPreviewPosition.current.y}`);
            }
            
            console.log(`Updated column to: ${currentColumn.current}`);
        }

        // Add all new nodes to the flow
        setNodes((nds) => [...nds, ...newNodes]);

        // Call the callback with first node position if provided
        if (firstNodePosition && onFirstNodeCreated) {
            onFirstNodeCreated(firstNodePosition.x, firstNodePosition.y);
        }

    }, [nodes, setNodes, nextWebPreviewPosition, currentColumn, searchForWebsiteUrl]);

    // Function to create FontNodes from chat API responses
    const createFontNodes = useCallback(async (fontNodesData: FontNodeData[], onFirstNodeCreated?: (x: number, y: number) => void) => {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const nodeWidth = 700;
        const nodeHeight = 650;
        const horizontalSpacing = 50;
        const verticalSpacing = 100;
        
        // Position to the right of web preview nodes to avoid overlap
        const webPreviewAreaWidth = 600 + 2 * (1280 + 700); // Start + 2 columns * (width + spacing)
        const baseY = nextWebPreviewPosition.current.y; // Same row as web preview nodes
        
        // First, create a text instruction node with font guidance  
        const instructionNodeWidth = 400;
        const instructionNodeX = webPreviewAreaWidth + 200; // Position to the right of web preview area
        const instructionNodeY = baseY;
        
        const instructionNode: Node = {
            id: `font-instruction-${Date.now()}`,
            type: 'textInstructionNode',
            position: { x: instructionNodeX, y: instructionNodeY },
            data: {
                title: 'Font Selection Guidelines',
                instructions: [
                    '• Use 1-2 fonts maximum for consistency',
                    '• Headers: Bold, impactful fonts',
                    '• Body text: Readable, comfortable fonts',
                    '• Match font personality to brand voice',
                    '• Test readability at all sizes'
                ],
                designContext: 'Choosing the right fonts sets the tone for your entire design'
            },
            style: {
                width: instructionNodeWidth,
            },
        };
        
        newNodes.push(instructionNode);
        
        // Call the callback with instruction node position for viewport centering
        if (onFirstNodeCreated) {
            // Center on the beginning of the font selection area (instruction node)
            onFirstNodeCreated(instructionNodeX + instructionNodeWidth / 2, instructionNodeY + 200);
        }
        
        // Create separate nodes for each font category
        const categories = ['Sans Serif', 'Serif', 'Decorative'];
        const baseX = instructionNodeX + instructionNodeWidth + horizontalSpacing + 100;
        
        // Extract the preview text from the first font data
        const previewText = fontNodesData.length > 0 ? fontNodesData[0].parameters.previewText : "Your text here";
        
        categories.forEach((category, categoryIndex) => {
            const x = baseX + (categoryIndex * (nodeWidth + horizontalSpacing));
            const y = instructionNodeY;
            
            const fontNode: Node = {
                id: `font-${category.toLowerCase().replace(' ', '-')}-${Date.now()}`,
                type: 'fontNode',
                position: { x, y },
                data: {
                    previewText: previewText,
                    category: category,
                    onFontSelect: (nodeId: string, selectedFonts: { [category: string]: string }) => {
                        console.log('Font selection:', selectedFonts);
                    }
                },
                style: {
                    width: nodeWidth,
                    height: nodeHeight,
                },
            };
            
            newNodes.push(fontNode);
            
            // Create edge from instruction node to font node
            const edge: Edge = {
                id: `edge-${instructionNode.id}-${fontNode.id}`,
                source: instructionNode.id,
                target: fontNode.id,
                targetHandle: 'a', // The FontNode has a target handle with id="a"
                type: 'smoothstep',
            };
            
            newEdges.push(edge);
        });
        
        if (newNodes.length > 0) {
            setNodes((prevNodes) => [...prevNodes, ...newNodes]);
            setEdges((prevEdges) => [...prevEdges, ...newEdges]);
        }
    }, [setNodes, setEdges]);

    // Function to create TextInstructionNodes from chat API responses
    const createTextInstructionNodes = useCallback(async (textInstructionNodesData: TextInstructionNodeData[]) => {
        const newNodes: Node[] = [];
        const nodeWidth = 350;
        const nodeHeight = 200;
        const horizontalSpacing = 50;
        
        for (const textInstructionData of textInstructionNodesData) {
            const x = currentColumn.current * (nodeWidth + horizontalSpacing) + 50;
            const y = 50;
            
            const newNode: Node = {
                id: `text-instruction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'textInstructionNode',
                position: { x, y },
                data: {
                    title: textInstructionData.parameters.title,
                    instructions: textInstructionData.parameters.instructions,
                    designContext: textInstructionData.parameters.designContext
                }
            };
            
            newNodes.push(newNode);
            currentColumn.current++;
        }
        
        if (newNodes.length > 0) {
            setNodes((prevNodes) => [...prevNodes, ...newNodes]);
        }
    }, [setNodes, currentColumn]);

    // Function to create design notes node connected to WebPreview node
    const createDesignNotesNode = useCallback((sourceNodeId: string, websiteUrl: string, feedback: { notes: string }) => {
        const sourceNode = nodes.find(node => node.id === sourceNodeId);
        if (!sourceNode) return;

        // Extract website name from URL for storage
        const websiteName = websiteUrl ? new URL(websiteUrl).hostname : 'Unknown Website';
        
        // Save the design note to session storage
        const noteId = addDesignNote(websiteName, feedback.notes);

        // Position the notes node to the right of the WebPreview node
        const notesNodeId = `design-notes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notesX = sourceNode.position.x + 1380; // WebPreview width (1280) + small gap (100)
        const notesY = sourceNode.position.y + 50; // Slightly offset vertically
        
        const newNotesNode: Node = {
            id: notesNodeId,
            type: 'designNotesNode',
            position: { x: notesX, y: notesY },
            data: {
                feedback,
                websiteUrl,
                timestamp: new Date(),
                noteId // Store the note ID for potential future reference
            }
        };

        // Create edge connecting WebPreview to Notes
        const newEdge: Edge = {
            id: `edge-${sourceNodeId}-${notesNodeId}`,
            source: sourceNodeId,
            target: notesNodeId,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 }
        };

        // Add node and edge to the flow
        setNodes(prevNodes => [...prevNodes, newNotesNode]);
        setEdges(prevEdges => [...prevEdges, newEdge]);
    }, [nodes, setNodes, setEdges]);

    // Function to create design critique node connected to WebPreview node
    const handleGenerateCritique = useCallback(async (sourceNodeId: string, websiteUrl: string, screenshotUrl: string) => {
        console.log("Generating critique for website:", websiteUrl);
        console.log("sourceNodeId:", sourceNodeId);
        
        // Get the current nodes using functional state update to avoid stale closure
        let sourceNodePosition: { x: number; y: number } | null = null;
        
        setNodes((currentNodes) => {
            const sourceNode = currentNodes.find(node => node.id === sourceNodeId);
            if (sourceNode) {
                sourceNodePosition = sourceNode.position;
                console.log("✅ Found source node:", sourceNodeId, "at position:", sourceNodePosition);
            } else {
                console.error("❌ Source node not found! Looking for:", sourceNodeId, "Available:", currentNodes.map(n => n.id));
            }
            return currentNodes; // Don't modify nodes, just read them
        });
        
        if (!sourceNodePosition) {
            console.error("Unable to get source node position, aborting critique generation");
            return;
        }
        
        // TypeScript assertion since we know sourceNodePosition is not null at this point
        const position = sourceNodePosition as { x: number; y: number };

        // Position the critique node below the notes node area
        const critiqueNodeId = `design-critique-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const critiqueX = position.x + 1380; // WebPreview width (1280) + small gap (100)
        const critiqueY = position.y + 350; // Below notes nodes
        
        // Create the critique node with loading state first
        const newCritiqueNode: Node = {
            id: critiqueNodeId,
            type: 'designCritiqueNode',
            position: { x: critiqueX, y: critiqueY },
            data: {
                critique: '', // Start empty, will be filled by API
                websiteUrl,
                timestamp: new Date()
            }
        };

        // Create edge connecting WebPreview to Critique
        const newEdge: Edge = {
            id: `edge-${sourceNodeId}-${critiqueNodeId}`,
            source: sourceNodeId,
            target: critiqueNodeId,
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 }
        };

        // Add node and edge to the flow first (with loading state)
        setNodes(prevNodes => [...prevNodes, newCritiqueNode]);
        setEdges(prevEdges => [...prevEdges, newEdge]);

        // Convert screenshot URL to base64
        const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
            console.log("Converting image to base64:", imageUrl);
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = imageUrl;
            });
        };

        // Make API call to get critique
        try {
            console.log("Starting API call for critique...");
            console.log("Screenshot URL:", screenshotUrl);
            const screenshotBase64 = await convertImageToBase64(screenshotUrl);
            console.log("Screenshot base64 length:", screenshotBase64.length);
            console.log("Screenshot base64 preview:", screenshotBase64.slice(0, 100));
            
            console.log("Making API request to /api/design-critique...");
            const response = await fetch('/api/design-critique', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    websiteUrl,
                    screenshotBase64
                })
            });

            console.log("API response status:", response.status);
            const data = await response.json();
            console.log("API response data:", data);
            
            if (data.critique) {
                // Update the node with the actual critique and persona
                setNodes(prevNodes => 
                    prevNodes.map(node => 
                        node.id === critiqueNodeId 
                            ? { ...node, data: { ...node.data, critique: data.critique, persona: data.persona } }
                            : node
                    )
                );
            }
        } catch (error) {
            console.error('Error generating critique:', error);
            // Update node with error message
            setNodes(prevNodes => 
                prevNodes.map(node => 
                    node.id === critiqueNodeId 
                        ? { ...node, data: { ...node.data, critique: 'Sorry, I encountered an error while analyzing this design. Please try again.' } }
                        : node
                )
            );
        }
    }, [setNodes, setEdges, nodes]);



    const setRenderCodeContentList = useCallback(
        (newCodeContentList: codeRenderNodeContent[]) => {
            setRenderCodeContentListState(newCodeContentList);
        },
        []
    );

    const addRenderCodeContent = useCallback(
        (newContent: codeRenderNodeContent) => {
            setRenderCodeContentListState((prevList) => [
                ...prevList,
                newContent,
            ]);
        },
        []
    );

    const updateDisplayCode = (newCode: string) => {
        setDisplayCode((displayCode) => {
            // Update the code in the list when code editor updates
            setRenderCodeContentListState((prevList) => {
                return prevList.map((content) => {
                    return {
                        ...content,
                        code:
                            content.code.trim() === displayCode.trim()
                                ? newCode.replaceAll(`{" "}`, "")
                                : content.code,
                    };
                });
            });
            return newCode;
        });
    };

    // Function to get initial positions for nodes - position to the right of web preview area
    const getInitialPositions = () => {
        const nodesPerRow = 2; // Number of nodes per row
        const horizontalSpacing = 800; // Spacing between nodes horizontally
        const verticalSpacing = 1200; // Spacing between nodes vertically
        // Position to the right of the web preview area
        const startX = Math.max(nextWebPreviewPosition.current.x + 2800, 3200); // Position to the right of web preview nodes
        const startY = 300; // Initial y position

        return renderCodeContentList.map((_, idx) => {
            const row = Math.floor(idx / nodesPerRow); // Determine the current row
            const col = idx % nodesPerRow; // Determine the current column

            return {
                x: startX + col * horizontalSpacing, // Calculate x based on column
                y: startY + row * verticalSpacing, // Calculate y based on row
            };
        });
    };

    const getCodeRenderNodes = (initialPositions: coordinatePositionType[]) => {
        return renderCodeContentList.map((renderContent, idx) => {
            const renderCode = renderContent.code.replaceAll(`{" "}`, ""); // sometimes there are weird formatting issues that inserts this empty string to the formatted code
            const newNodeId = renderContent.nodeId
                ? renderContent.nodeId
                : "code-" + nodes.length; // TODO This is a hack
            const existingNode = nodes.find((node) => node.id === newNodeId);

            if (existingNode) {
                // Update the existing node with the new code
                return {
                    ...existingNode,
                    data: {
                        ...existingNode.data,
                        renderCode: renderCode,
                        blendedCode: renderContent.blendedCode
                            ? renderContent.blendedCode
                            : existingNode.data.blendedCode, // only update when the field is set, the field is only set through re-generation
                        categorizedChanges: renderContent.categorizedChanges,
                    },
                };
            } else {
                // Create a new node if it doesn't exist
                return {
                    id: newNodeId,
                    type: "codeRenderNode",
                    position: initialPositions[idx],
                    data: {
                        response: response,
                        renderCode: renderCode,
                        prevCode: renderContent.prevCode,
                        blendedCode: renderCode, // when we create a new node, we record its original updated code after blending, so we can reset when needed
                        categorizedChanges: renderContent.categorizedChanges,
                        textPrompt: renderContent.textPrompt,
                        base64Image: renderContent.base64Image,
                        sourceNodeId: renderContent.sourceNodeId,
                    },
                };
            }
        });
    };

    // Simple approach - just add code render nodes when renderCodeContentList changes
    useEffect(() => {
        if (renderCodeContentList.length > 0) {
            const initialPositions = getInitialPositions();
            const codeNodes = getCodeRenderNodes(initialPositions);
            
            setNodes((prevNodes) => {
                // Only add code render nodes that don't already exist
                const existingCodeNodeIds = new Set(
                    prevNodes.filter(n => n.type === 'codeRenderNode').map(n => n.id)
                );
                const newCodeNodes = codeNodes.filter(n => !existingCodeNodeIds.has(n.id));
                
                if (newCodeNodes.length > 0) {
                    return [...prevNodes, ...newCodeNodes];
                }
                return prevNodes;
            });
        }
    }, [renderCodeContentList]);

    const processReplacementPromptResponse = async (
        finishedResponse: string,
        renderCodeBoundingBox: BoundingBox,
        renderCode: string
    ) => {
        // when reposne is updated from the api call, we post process it
        // 1. fetch the parsed Result
        const parsedData: ParsedData =
            parseReplacementPromptResponse(finishedResponse); // TODO if we do the realtime parsing stream thing, parseReplacementPromptResponse will handle partial json
        const codeChangeList: CodeChange[] = parsedData.codeChanges;

        let currentRenderCode = renderCode; // we keep a local copy of the code and only update the state at the end
        // 2. Replace the code pieces from the render code
        for (const codeChange of codeChangeList) {
            try {
                const originalCodePiece = removeEscapedChars(
                    codeChange.originalCode.replaceAll("'", '"')
                );
                const replacementCodePiece = removeEscapedChars(
                    codeChange.replacementCode
                );

                //     const replacementCodeWithComment = `
                // {/* ${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)} replaced code beginnning */}
                // {/* ${originalCodePiece} */}
                // {/* ${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)} replaced code end */}
                // {/* ${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)} new code beginnning */}
                // ${replacementCodePiece}
                // {/* ${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)} new code end */}
                // `

                const escapeRegExp = (str: string) => {
                    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
                };

                const createFlexiblePattern = (str: string) => {
                    const escapedStr = escapeRegExp(str);
                    return escapedStr
                        .replace(/[\s\n\r]+/g, "\\s*") // Handle varying whitespace, newlines, and carriage returns
                        .replace(/<\//g, "<\\/?\\s*") // Make closing slashes optional with optional whitespace
                        .replace(/\/>/g, "\\s*\\/?\\s*>") // Make self-closing slashes optional with optional whitespace
                        .replace(/>/g, "\\s*\\/?>\\s*") // Allow optional whitespace after closing angle brackets
                        .replace(/</g, "\\s*<"); // Allow optional whitespace before opening angle brackets
                };

                const searchPattern = new RegExp(
                    createFlexiblePattern(originalCodePiece),
                    "g"
                );

                if (
                    searchPattern.test(currentRenderCode.replaceAll("'", '"'))
                ) {
                    // console.log("replacing code: " + originalCodePiece + ", search pattern: " + searchPattern);
                    // Replace and update the state using the original render code
                    const updatedRenderCode = currentRenderCode
                        .replaceAll("'", '"')
                        .replace(searchPattern, replacementCodePiece);
                    try {
                        currentRenderCode = await formatCode(updatedRenderCode);
                    } catch (err) {
                        // console.log("error in format code: " + err);
                        currentRenderCode = updatedRenderCode; // we just update without formatting it
                    }
                } else {
                    // console.log(
                    //     "Cannot find the reg ex in the source renderCode: " +
                    //         searchPattern
                    // );
                    setShowError(true);
                }
            } catch (error) {
                // console.log(
                //     "An error occurred when parsing response. Try again?"
                // );
                setShowError(true);
            }
        }
        // URGENT TODO COME BACK AND FIX THIS, PLUS TEST AGAIN THE WHOLE FUNCTION
        // 3. add explanations
        const explanations: string = parsedData.explanations;
        addExplanationsNode([explanations], renderCodeBoundingBox); // TODO set this position to between the old and new render node, plus the explanation format is now different

        // const newRenderCodeContent: codeRenderNodeContent = {
        //     code: currentRenderCode,
        //     changes: explanations
        // };

        // addRenderCodeContent(newRenderCodeContent);   // update the state only after everything is replaced, after each api call, add to the renderCode list, which will create a new node
    };

    const processParsedCode = (code: string) => {
        let updatedCode = code.trim().replaceAll(/`/g, "");

        // Check if updatedCode does not start with () =>
        if (!updatedCode.startsWith("() =>")) {
            // Find the index of () =>
            const arrowFunctionIndex = updatedCode.indexOf("() =>");

            // If () => is found, slice the code from that point
            if (arrowFunctionIndex !== -1) {
                updatedCode = updatedCode.slice(arrowFunctionIndex);
            }
        }

        if (updatedCode.includes("export")) {
            updatedCode = updatedCode.split("export")[0];
        }

        updatedCode = updatedCode.replaceAll("fixed", "absolute"); // the previous will mess up react live

        // Remove extra closing parentheses if present
        const extraParenthesesPattern = /\)\s*\)\s*;\s*\};$/;
        if (extraParenthesesPattern.test(updatedCode)) {
            updatedCode = updatedCode.replace(
                extraParenthesesPattern,
                ");\n};"
            );
        }

        // Define the regex pattern to check the desired format
        const regexPattern = /^\(\)\s*=>\s*\{\s*([\s\S]*?)\s*\};?$/;

        // Test if the updatedCode matches the regex pattern
        // TODO if this does not match the format, maybe we should just return null?
        if (!regexPattern.test(updatedCode)) {
            // Handle the case where the code does not match the desired format
            // console.log("code does not match the desired format in regex");
            setShowError(true);
        }

        // console.log(
        //     "still contains backticks after formatting? " +
        //         updatedCode.includes("`")
        // );
        return updatedCode;
    };

    const processGlbalBlendingResponse = async (
        finishedResponse: string,
        renderCodeBoundingBox: BoundingBox,
        renderCode: string,
        textPrompt: string,
        base64Image: string,
        sourceNodeId: string
    ) => {
        // fetch the parsed Result
        const parsedData: ParsedGlobalBlendingData | null =
            safeParseResponse(finishedResponse);
        
        if (!parsedData) {
            console.error("Failed to parse API response, aborting");
            return;
        }
        let updatedCode = processParsedCode(parsedData.updatedCode);

        try {
            updatedCode = await formatCode(updatedCode);
        } catch (err) {
            // console.log("error in format code: " + err);
        }

        // console.log("displaying updated code...\n" + parsedData);

        const categorizedChanges: CategorizedChange[] =
            parsedData.categorizedChanges;

        const newRenderCodeContent: codeRenderNodeContent = {
            nodeId: `code-${renderCodeContentList.length}`,
            code: updatedCode,
            prevCode: renderCode,
            categorizedChanges: categorizedChanges,
            sourceNodeId: sourceNodeId,
            textPrompt: textPrompt,
            base64Image: base64Image,
        };

        addRenderCodeContent(newRenderCodeContent);
        // addExplanationsNode(changes, renderCodeBoundingBox);   // TODO fix this set this position to between the old and new render node
    };

    const handleCodeReplacement = (nodeId: string, newCode: string) => {
        setRenderCodeContentListState(
            (renderCodeList: codeRenderNodeContent[]) =>
                renderCodeList.map(
                    (renderCodeContent: codeRenderNodeContent) =>
                        renderCodeContent.nodeId === nodeId
                            ? {
                                  ...renderCodeContent,
                                  code: newCode.replaceAll(`{" "}`, ""),
                              }
                            : renderCodeContent
                )
        );
    };

    const updateLoadingState = (
        targetCodeRenderNodeId: string,
        newState: boolean
    ) => {
        // console.log(
        //     "updating state with target code id: " + targetCodeRenderNodeId
        // );
        setLoadingStates((items) => {
            // Check if the item already exists in the state
            const itemExists = items.some(
                (item) => item.id === targetCodeRenderNodeId
            );

            // If the item exists, update its loading state
            if (itemExists) {
                return items.map((item) => {
                    if (item.id === targetCodeRenderNodeId) {
                        return { ...item, loading: newState };
                    }
                    return item;
                });
            } else {
                // If the item does not exist, add it to the state
                return [
                    ...items,
                    { id: targetCodeRenderNodeId, loading: true },
                ];
            }
        });
    };

    /**
     * handleFetchResponse sends a request to a backend API and processes the response to update a node's state in the React Flow diagram.
     *
     * @param {string} textPrompt - The prompt or message that is sent to the backend API, typically constructed based on the node's content.
     * @param {string} [base64Image=""] - A base64-encoded image string included in the request, used for image-based reasoning or blending tasks.
     * @param {boolean} [jsonMode=true] - A flag indicating whether the API response should be expected in JSON format.
     * @param {BoundingBox} [renderCodeBoundingBox=defaultBoundingBox] - The bounding box (position and size) of the node where the code will be rendered.
     * @param {string} renderCode - The current code associated with the node that triggered the API call, used to apply the API response (e.g., blending or replacing code).
     * @param {string} [targetNodeId=""] - The ID of the target node in the React Flow diagram to be updated based on the API response.
     * @param {boolean} [globalBlending=false] - A flag indicating whether the operation involves global blending of code or a more specific code replacement task.
     * @param {string} sourceNodeId - The ID of the source node from which the operation was initiated, used for context in blending operations.
     * @param {boolean} [isRegenerate=false] - A flag indicating whether the function is regenerating a previous request, potentially altering behavior such as skipping unnecessary steps.
     *
     * This function processes the response from the API, performs code transformations, and updates the relevant node with new code and related data.
     */

    const handleFetchResponse = async (
        textPrompt: string,
        base64Image = "",
        jsonMode = true,
        renderCodeBoundingBox = defaultBoundingBox,
        renderCode: string,
        targetNodeId = "",
        globalBlending = false,
        sourceNodeId: string,
        isRegenerate = false
    ) => {
        // console.log("Taget node id " + targetNodeId);
        // set the loading status here
        targetNodeId === ""
            ? updateLoadingState(targetCodeRenderNodeId, true)
            : updateLoadingState(targetNodeId, true);

        // console.log(
        //     "calling api, node " + targetCodeRenderNodeId + " started! "
        // );
        // console.log("prompt: " + textPrompt);
        setResponse("");
        const controller = new AbortController();
        setAbortController(controller);

        try {
            // Use original image without blurring for better quality
            // const blurredBase64 = await blurImage(base64Image);

            const messageData = {
                message: textPrompt,
                image: base64Image,
                json_mode: jsonMode,
            };

            // console.log("message data: " + JSON.stringify(messageData));

            // call the api and stream
            const response = await fetch(fetchResponseUrl, {
                signal: controller.signal,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Here we start prepping for the streaming response
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let loopRunner = true;
                let finalResponse = "";

                while (loopRunner) {
                    const { value, done } = await reader.read();
                    if (done) {
                        loopRunner = false;
                        break;
                    }
                    const decodedChunk = decoder.decode(value, {
                        stream: true,
                    });
                    // console.log("new chunk: " + decodedChunk);
                    finalResponse += decodedChunk;
                    setResponse((prevResponse) => prevResponse + decodedChunk);
                }

                // TODO Figure out how to deal with replacementPrompts
                // globalBlending ? processGlbalBlendingResponse(finalResponse, renderCodeBoundingBox, renderCode) : processReplacementPromptResponse(finalResponse, renderCodeBoundingBox, renderCode);

                if (isRegenerate) {
                    // Fetch the parsed Result
                    const parsedData: ParsedGlobalBlendingData | null =
                        safeParseResponse(finalResponse);
                    
                    if (!parsedData) {
                        console.error("Failed to parse API response in regenerate mode, aborting");
                        return;
                    }
                    let updatedCode = processParsedCode(parsedData.updatedCode);

                    // Update the existing renderCodeContentList entry instead of adding a new one
                    // console.log(
                    //     "yo, finished fetch response, here's the updated blendedCode: " +
                    //         updatedCode
                    // );
                    setRenderCodeContentListState((prevList) =>
                        prevList.map((content) =>
                            content.nodeId === targetNodeId
                                ? {
                                      ...content,
                                      code: updatedCode, // Update with the processed code
                                      blendedCode: updatedCode, // this field is optional and only gets set through regeneration
                                      prevCode: renderCode, // Set the previous code
                                      categorizedChanges:
                                          parsedData.categorizedChanges, // Update categorized changes
                                      response: finalResponse, // Store the final response
                                  }
                                : content
                        )
                    );
                } else {
                    processGlbalBlendingResponse(
                        finalResponse,
                        renderCodeBoundingBox,
                        renderCode,
                        textPrompt,
                        base64Image,
                        sourceNodeId
                    );
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                // console.log("Fetch aborted");
            } else {
                console.error("Error fetching response from OpenAI API");
                // console.log("error openai api call: " + err);
            }
        } finally {
            targetNodeId === ""
                ? updateLoadingState(targetCodeRenderNodeId, false)
                : updateLoadingState(targetNodeId, false);
            setAbortController(null);
        }
    };

    const fixCodeNotRendering = async (code: string, targetNodeId: string) => {
        // console.log("Taget node id " + targetNodeId);
        // set the loading status here
        targetNodeId === ""
            ? updateLoadingState(targetCodeRenderNodeId, true)
            : updateLoadingState(targetNodeId, true);
        setResponse("");
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const messageData = {
                message:
                    "This piece of code is not rendering properly, please help me fix it. Return only the updated code and nothing else. Use typescript. Follow the format of a simple React component () => {}. \n" +
                    code,
                json_mode: false,
            };

            // call the api and stream
            const response = await fetch(fetchResponseUrl, {
                signal: controller.signal,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Here we start prepping for the streaming response
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let loopRunner = true;
                let finalResponse = "";

                while (loopRunner) {
                    const { value, done } = await reader.read();
                    if (done) {
                        loopRunner = false;
                        break;
                    }
                    const decodedChunk = decoder.decode(value, {
                        stream: true,
                    });
                    // console.log("new chunk: " + decodedChunk);
                    finalResponse += decodedChunk;
                    setResponse((prevResponse) => prevResponse + decodedChunk);
                }

                finalResponse = processParsedCode(finalResponse);

                setRenderCodeContentListState((prevList) =>
                    prevList.map((content) =>
                        content.nodeId === targetNodeId
                            ? {
                                  ...content,
                                  code: finalResponse, // Update with the processed code
                                  blendedCode: finalResponse, // this field is optional and only gets set through regeneration
                              }
                            : content
                    )
                );
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                // console.log("Fetch aborted");
            } else {
                console.error("Error fetching response from OpenAI API");
                // console.log("error openai api call: " + err);
            }
        } finally {
            targetNodeId === ""
                ? updateLoadingState(targetCodeRenderNodeId, false)
                : updateLoadingState(targetNodeId, false);
            setAbortController(null);
        }
    };

    const fetchSemanticDiffingResponse = async (
        code: string,
        targetNodeId: string,
        prevCode: string,
        discardCategory: string,
        addCategory: string,
        allCategories: string[]
    ) => {
        // console.log("Target node id " + targetNodeId);

        // Set the loading status here
        targetNodeId === ""
            ? updateLoadingState(targetCodeRenderNodeId, true)
            : updateLoadingState(targetNodeId, true);
        setResponse("");
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const messageData = {
                message: `Now I have this piece of code:\n${code} \n. It was made by changing this piece of code: \n ${prevCode} \n. In total, these changes were being made: ${allCategories.join(", ")}. Can you help me ${discardCategory ? `discard ${discardCategory};` : ""}${addCategory ? ` add ${addCategory}?` : ""}, while keeping the rest? Return the updated code only, using a simple component format () => {return ()}.`,
                json_mode: false,
            };

            // Call the API and stream the response
            const response = await fetch(fetchResponseUrl, {
                signal: controller.signal,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle streaming response
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let loopRunner = true;
                let finalResponse = "";

                while (loopRunner) {
                    const { value, done } = await reader.read();
                    if (done) {
                        loopRunner = false;
                        break;
                    }
                    const decodedChunk = decoder.decode(value, {
                        stream: true,
                    });
                    finalResponse += decodedChunk;
                    setResponse((prevResponse) => prevResponse + decodedChunk);
                }

                finalResponse = processParsedCode(finalResponse);

                setRenderCodeContentListState((prevList) =>
                    prevList.map((content) =>
                        content.nodeId === targetNodeId
                            ? {
                                  ...content,
                                  code: finalResponse, // Update with the processed code
                                  blendedCode: finalResponse, // this field is optional and only gets set through regeneration
                              }
                            : content
                    )
                );
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                // console.log("Fetch aborted");
            } else {
                console.error("Error fetching response from OpenAI API");
                // console.log("error openai api call: " + err);
            }
        } finally {
            targetNodeId === ""
                ? updateLoadingState(targetCodeRenderNodeId, false)
                : updateLoadingState(targetNodeId, false);
            setAbortController(null);
        }
    };

    const handleDesignGeneration = async (
        designContext: string,
        targetNodeId: string,
        _designRequest: any
    ) => {
        updateLoadingState(targetNodeId, true);
        setResponse("");
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const requestData = {
                designContext
            };

            const response = await fetch('/api/design-generation', {
                signal: controller.signal,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let loopRunner = true;
                let finalResponse = "";

                while (loopRunner) {
                    const { value, done } = await reader.read();
                    if (done) {
                        loopRunner = false;
                        break;
                    }
                    const decodedChunk = decoder.decode(value, {
                        stream: true,
                    });
                    finalResponse += decodedChunk;
                    setResponse((prevResponse) => prevResponse + decodedChunk);
                }

                try {
                    // Parse the JSON response
                    console.log('📦 Final design generation response:', finalResponse);
                    const designResult = JSON.parse(finalResponse);
                    console.log('✅ Parsed design result:', designResult);
                    const { designCode } = designResult;
                    console.log('💻 Extracted design code:', designCode);

                    // Update the design generation node with the new code
                    setNodes((prevNodes) =>
                        prevNodes.map((node) =>
                            node.id === targetNodeId
                                ? {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        designCode: designCode
                                    }
                                }
                                : node
                        )
                    );
                } catch (parseError) {
                    console.error("Error parsing design generation response:", parseError);
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                console.log("Design generation aborted");
            } else {
                console.error("Error in design generation:", err);
            }
        } finally {
            updateLoadingState(targetNodeId, false);
            setAbortController(null);
        }
    };

    const addExplanationsNode = (
        explanations: Change[] | string[],
        renderCodeNodeBoundingBox: BoundingBox
    ) => {
        // console.log(
        //     "Received bbox in flowcomponent: " +
        //         JSON.stringify(renderCodeNodeBoundingBox)
        // );
        const newXPos =
            renderCodeNodeBoundingBox.x + renderCodeNodeBoundingBox.width + 200;
        // const newYPos = renderCodeNodeBoundingBox.x + renderCodeNodeBoundingBox.width + 200; // TODO calculate y position based on count of explanationNode
        // console.log("newXPos: " + newXPos);
        setNodes((nds) => {
            return nds.concat({
                id: String(nds.length + 1),
                type: "explanationNode",
                draggable: true,
                position: { x: newXPos, y: renderCodeNodeBoundingBox.y },
                data: { text: explanations },
            });
        });
    };

    useEffect(() => {
        // console.log("openai api response updated: " + response);
        // update the coderendernode to display generation progress
        setNodes((nds) =>
            nds.map((node) =>
                node.type === "codeRenderNode" || node.type === "designGenerationNode"
                    ? { ...node, data: { ...node.data, response: response } }
                    : node
            )
        );
    }, [response]);

    const onNodesChange: OnNodesChange = useCallback((changes) => {
        // update nodes
        setNodes((nds) => applyNodeChanges(changes, nds));

        let removedNodeId: string[] = [];
        // remove the code content that corresponds to the node that is removed
        changes.forEach((change) => {
            if (change.type === "remove") {
                setRenderCodeContentListState((list) =>
                    list.filter((code) => code.nodeId !== change.id)
                );
                removedNodeId.push(change.id);
            }
        });

        // update edges too
        setEdges((eds) =>
            eds.filter((ed) => {
                if (ed.sourceNode && ed.targetNode) {
                    return (
                        !removedNodeId.includes(ed.sourceNode.id) &&
                        !removedNodeId.includes(ed.targetNode.id)
                    );
                } else {
                    return true;
                }
            })
        );
    }, []);
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect: OnConnect = (connection) => {
        setEdges((eds) => addEdge(connection, eds));
        // console.log("connection added: \n" + JSON.stringify(connection));
        if (connection.targetHandle === "render-t") {
            // if it's a whole image node, maybe do some implicit intent reasoning
            // console.log("seems like a source node. id: " + connection.source);
            const sourceNode = nodes.find(
                (node) => node.id === connection.source
            );
            const targetNode = nodes.find(
                (node) => node.id === connection.target
            );
            if (sourceNode && targetNode) {
                // console.log("setting targetNodeId, " + targetNode.id)
                setTargetCodeRenderNodeId(targetNode.id);
                const referenceImageBase64 = sourceNode.data.image;
                const textPrompt = constructTextPrompt(
                    targetNode.data.renderCode
                );
                // we have to pass the targetNode.id in here because of some weird state not updating & async function call issues
                handleFetchResponse(
                    textPrompt,
                    referenceImageBase64,
                    true,
                    targetRenderCodeNodeBbox
                        ? targetRenderCodeNodeBbox
                        : defaultBoundingBox,
                    targetNode.data.renderCode,
                    targetNode.id,
                    true,
                    sourceNode.id
                ); // TODO Add the bbox of rendercode node
            } else {
                // console.log(
                //     "Error: cannot find source node. current nodes: \n" + nodes
                // );
            }
            setEdges((eds) =>
                eds.filter(
                    (e) =>
                        e.source !== connection.source ||
                        e.sourceHandle !== connection.sourceHandle ||
                        e.target !== connection.target ||
                        e.targetHandle !== connection.targetHandle
                )
            ); // remove the edge if it's just connecting to blend
        }
    };

    const createSubImages = (sourceId: string, imageUrlList: string[]) => {
        let currentNode: Node | undefined;
        let newNodeId: number | undefined;

        setNodes((nds) => {
            currentNode = nds.find((node) => node.id === sourceId);
            newNodeId = nds.length + 1;
            return nds;
        });

        let currentRightEdge = 1500;
        let currentTopEdge = 500;
        if (currentNode && currentNode.width && currentNode.height) {
            currentRightEdge = currentNode.position.x + currentNode.width;
            currentTopEdge = currentNode.position.y;
        } else {
            // console.log("Cannot find the node with target id " + sourceId);
        }

        imageUrlList.forEach((imageUrl, index) => {
            if (newNodeId !== undefined) {
                const validNewNodeId: string = newNodeId.toString();
                setNodes((nds) => {
                    // console.log(
                    //     "Creating new node for image at index " + index
                    // );
                    return nds.concat({
                        id: validNewNodeId,
                        type: "subimageNode",
                        draggable: true,
                        position: {
                            x: currentRightEdge + 100,
                            y: currentTopEdge + 100,
                        },
                        data: {
                            image: imageUrl,
                            isDragging: isDragging,
                            setIsDragging: setIsDragging,
                            setNewConfirmationPopupNodeDataPackage:
                                setNewConfirmationPopupNodeDataPackage,
                        },
                    });
                });

                const newEdge = {
                    id: `e-${sourceId}-${newNodeId}`,
                    source: sourceId,
                    target: validNewNodeId,
                };

                setEdges((eds) => addEdge(newEdge, eds));
            }
        });
    };

    const addNewEdge = (edge: Edge) => {
        const edgeExists = edges.find((edg) => edg.id === edge.id);
        if (!edgeExists) {
            setEdges((eds) => addEdge(edge, eds));
            // console.log("New edge added, id: " + edge.id);
        }
    };

    const removeNode = (id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
    };

    const showBlendingConfirmationPopup = (
        popUpPosition: coordinatePositionType,
        viewportX: number,
        viewportY: number,
        zoom: number,
        subImageScreenshot: string,
        sourceNodeId: string
    ) => {
        const posX = (popUpPosition.x - viewportX) / zoom; // adjust for window transform and zoom for react flow
        const posY = (popUpPosition.y - viewportY) / zoom;

        if (posX !== 0 && posY !== 0) {
            setNodes((nds) => {
                const newNodeId = nds.length + 1;
                // console.log("Creating blend confirmation popup with id " + newNodeId);
                return nds.concat({
                    id: newNodeId.toString(),
                    type: "confirmationPopupNode",
                    draggable: true,
                    position: { x: posX, y: posY },
                    data: {
                        position: popUpPosition,
                        removeNode: removeNode,
                        renderCode: targetBlendCode,
                        targetCodeDropped: targetCodeDropped,
                        handleFetchResponse: handleFetchResponse,
                        targetCodeRenderNodeId: targetCodeRenderNodeId,
                        subImageScreenshot: subImageScreenshot,
                        targetRenderCodeNodeBbox: targetRenderCodeNodeBbox,
                        sourceNodeId: sourceNodeId,
                    },
                });
            });
        }
    };

    // when the blendingOptionPosition changes, that means we can show the popup
    useEffect(() => {
        showBlendingConfirmationPopup(
            newConfirmationPopupNodeDataPackage.mousePosition,
            x,
            y,
            zoom,
            newConfirmationPopupNodeDataPackage.subImageScreenshot,
            newConfirmationPopupNodeDataPackage.sourceNodeId
        );
    }, [newConfirmationPopupNodeDataPackage]);

    const importImage = (id: string, imageUrl: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === id
                    ? {
                          ...node,
                          data: { ...node.data, image: imageUrl },
                      }
                    : node
            )
        );

        setNodes((nds) =>
            nds.concat({
                id: `${nds.length + 1}`,
                type: "imageDisplayNode",
                draggable: true,
                position: { x: 800, y: 500 },
                data: { image: imageUrl, onSubImageConfirmed: createSubImages },
            })
        );

        // console.log("Image node added, current node length: " + nodes.length);
    };

    // memorize the code editor panel to avoid unnecessary re-render
    const showCodePanel = (displayCode: string) => (
        <CodeEditorPanel
            code={displayCode}
            setCode={updateDisplayCode}
            isVisible={codePanelVisible}
            setCodePanelVisible={setCodePanelVisible}
        />
    );

    const panOnDrag = [1, 2]; // useful for figma like interaction

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ReactFlow
                nodes={nodes.map((node) => {
                    if (node.type === "imageUploadNode") {
                        return {
                            ...node,
                            data: { ...node.data, onUpload: importImage },
                        };
                    } else if (node.type === "codeRenderNode") {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                toggleCodePanelVisible: toggleCodePanelVisible,
                                codePanelVisible: codePanelVisible,
                                isDragging: isDragging,
                                setTargetBlendCode: setTargetBlendCode,
                                setDisplayCode: setDisplayCode,
                                setTargetCodeDropped: setTargetCodeDropped,
                                setTargetRenderCodeNodeBbox:
                                    setTargetRenderCodeNodeBbox,
                                setTargetCodeRenderNodeId:
                                    setTargetCodeRenderNodeId,
                                loadingStates: loadingStates,
                                updateLoadingState: updateLoadingState,
                                abortController: abortController,
                                handleCodeReplacement: handleCodeReplacement,
                                addNewEdge: addNewEdge,
                                handleFetchResponse: handleFetchResponse,
                                fixCodeNotRendering: fixCodeNotRendering,
                                fetchSemanticDiffingResponse:
                                    fetchSemanticDiffingResponse,
                            },
                        };
                    } else if (node.type === "imageDisplayNode") {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                onSubImageConfirmed: createSubImages,
                            },
                        };
                    } else if (node.type === "designGenerationNode") {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                toggleCodePanelVisible: toggleCodePanelVisible,
                                codePanelVisible: codePanelVisible,
                                setDisplayCode: setDisplayCode,
                                loadingStates: loadingStates,
                                updateLoadingState: updateLoadingState,
                                abortController: abortController,
                                addNewEdge: addNewEdge,
                                handleDesignGeneration: handleDesignGeneration,
                            },
                        };
                    } else {
                        return node;
                    }
                })}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeDragThreshold={4}
                panOnScroll
                selectionOnDrag
                panOnDrag={panOnDrag}
                selectionMode={SelectionMode.Partial}
                onlyRenderVisibleElements={true}
                defaultEdgeOptions={defaultEdgeOptions}
                minZoom={0.1}
                maxZoom={4}
            >
                <Background />
                <Controls />
                {/* <div className='fixed p-5 top-0 rounded-b-md w-full bg-zinc-900 flex items-center z-50 font-semibold text-white'>
                    Misty
                </div> */}
                {showCodePanel(displayCode)}
                {/* <div>
                    {showError && (
                        <ErrorPopup
                            message="Oops! That did not work as planned. Try again?"
                        />
                    )}
                </div> */}
            </ReactFlow>
            
            {/* Chat Interface Components */}
            {showInitialDialog && (
                <InitialChatDialog
                    onStartChat={handleStartChat}
                    onClose={handleCloseInitialDialog}
                />
            )}
            
            {showChatInterface && (
                <ChatPanel
                    isMinimized={isChatMinimized}
                    onToggleMinimize={handleToggleChatMinimize}
                    initialMessage={initialMessage}
                    selectedModel={selectedModel}
                    onCreateWebPreviewNode={createWebPreviewNodes}
                    onCreateFontNode={createFontNodes}
                    onCreateTextInstructionNode={createTextInstructionNodes}
                    onCreateDesignGenerationNode={createDesignGenerationNode}
                    onCenterCanvas={handleCenterOnPosition}
                />
            )}
            
            {/* Design Feedback Popup */}
            <DesignFeedbackPopup
                isVisible={showFeedbackPopup}
                onClose={handleFeedbackClose}
                onSubmit={handleFeedbackSubmit}
                websiteUrl={currentFeedbackUrl}
            />
            
            {/* Web Inspection Guide Popup */}
            <WebInspectionGuidePopup
                isVisible={showInspectionGuide}
                onClose={handleInspectionGuideClose}
                onConfirm={handleInspectionGuideConfirm}
            />
            
            {/* <TSXDiff /> */}
        </div>
    );
};

export default FlowComponent;
