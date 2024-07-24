import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    Position
} from 'reactflow';
import ImageDisplayNode from './customNodes/ImageDisplayNode';
import ImageUploadNode from './customNodes/ImageUploadNode';
import ExplanationNode from './customNodes/ExplanationNode';
import CodeRenderNode from './customNodes/CodeRenderNode';
import SubImageNode from './customNodes/SubImageNode';
import ConfirmationPopupNode from './customNodes/ConfirmationPopupNode';
import CodeEditorPanel from './CodeEditorPanel';
import { FidelityNaturalHeader } from './renderCode/FidelityNaturalHeader';
import 'reactflow/dist/style.css';
import '../index.css';
import { removeEscapedChars, coordinatePositionType, BoundingBox, defaultBoundingBox, stripWhitespaceAndNormalizeQuotes, escapeRegex, formatCode, loadingIdState } from "../util";
import { parseResponse, constructTextPrompt, parseJsonResponse, CodeChange, ParsedData } from '../prompts';
import ErrorPopup from './ErrorPopup';
import { babelBase64, otteraiBase64, appleMapListBase64, appleFitness } from '../images';
import { BookList } from './renderCode/BookList';

const nodeTypes: NodeTypes = {
    imageUploadNode: ImageUploadNode,
    imageDisplayNode: ImageDisplayNode,
    subimageNode: SubImageNode,
    explanationNode: ExplanationNode,
    codeRenderNode: CodeRenderNode,
    confirmationPopupNode: ConfirmationPopupNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'imageUploadNode',
        position: { x: 150, y: 100 },
        data: { onUpload: () => { } },
    },
    {
        id: "2",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 800, y: 200 },
        data: { image: babelBase64 },
    },
    {
        id: "3",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 1500, y: 200 },
        data: { image: appleMapListBase64 },
    },
    {
        id: "4",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 800, y: 10 * 100 + 300 },
        data: { image: appleFitness },
    }
];

const initialEdges: Edge[] = [
];

const initialConfirmationPopupNodeDataPackage = {
    mousePosition: {
        x: 0,
        y: 0,
    },
    subImageScreenshot: ""
}

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
};

const FlowComponent: React.FC = () => {

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [isDragging, setIsDragging] = useState(false);  // when we drag subimagenode (washi tape)
    const [newConfirmationPopupNodeDataPackage, setNewConfirmationPopupNodeDataPackage] = useState(initialConfirmationPopupNodeDataPackage);
    const [codePanelVisible, setCodePanelVisible] = useState<boolean>(false);
    const [renderCodeList, setRenderCodeListState] = useState<string[]>([BookList]);
    const [displayCode, setDisplayCode] = useState<string>(""); // for the edit code panel

    // the below states are used to know what code is being blended, i.e. used in the api call. but ideally they should be managed as an object, maybe using redux, to avoid conflicted user operations
    const [targetBlendCode, setTargetBlendCode] = useState<string>(""); // for the code to be blended
    const [targetCodeDropped, setTargetCodeDropped] = useState<string>("");
    const [targetRenderCodeNodeBbox, setTargetRenderCodeNodeBbox] = useState<BoundingBox | null>(null);
    const [targetCodeRenderNodeId, setTargetCodeRenderNodeId] = useState<string>("");

    const { x, y, zoom } = useViewport();
    const [response, setResponse] = useState('');
    const [loadingStates, setLoadingStates] = useState<loadingIdState[]>([]);
    const [showError, setShowError] = useState(false);

    // abort api calls when the user cancels it 
    const [abortController, setAbortController] = useState<AbortController | null>(null);

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
    }

    const setRenderCodeList = useCallback((newCodeList: string[]) => {
        setRenderCodeListState(newCodeList);
    }, []);

    const addRenderCode = useCallback((newCode: string) => {
        setRenderCodeListState((prevList) => [...prevList, newCode]);
    }, []);

    const updateDisplayCode = (newCode: string) => {
        setDisplayCode((displayCode) => {
            // Update the code in the list
            setRenderCodeListState((prevList) => {
                return prevList.map((code) => {
                    return code.trim() === displayCode.trim() ? newCode : code;
                });
            });
            return newCode;
        })
    };

    // Function to get initial positions for nodes
    const getInitialPositions = () => {
        return renderCodeList.map((_, idx) => ({
            x: 2200 + 1000 * idx,
            y: 100
        }));
    };

    const getCodeRenderNodes = (initialPositions: coordinatePositionType[]) => {
        return renderCodeList.map((renderCode, idx) => {
            const newNodeId = `code-${idx}`; // The idx is the index in the renderCodeList array
            const existingNode = nodes.find((node) => node.id === newNodeId);

            if (existingNode) {
                // Update the existing node with the new code
                return {
                    ...existingNode,
                    data: {
                        ...existingNode.data,
                        renderCode: renderCode,
                    },
                };
            } else {
                // Create a new node if it doesn't exist
                return {
                    id: newNodeId,
                    type: 'codeRenderNode',
                    position: initialPositions[idx],
                    data: {
                        renderCode: renderCode,
                    },
                };
            }
        });
    };

    // Initialize nodes with positions
    useEffect(() => {
        const initialPositions = getInitialPositions();
        setNodes((nodes) => [...nodes, ...getCodeRenderNodes(initialPositions)]);
    }, [renderCodeList]);

    // TODO TESTING BLOCK
    useEffect(() => {
        console.log("LoadingStates updated, \n" + loadingStates.toString());
    }, [loadingStates]);


    const processResponse = async (finishedResponse: string, renderCodeBoundingBox: BoundingBox, renderCode: string) => {
        // when reposne is updated from the api call, we post process it

        // 1. fetch the parsed Result
        const parsedData: ParsedData = parseJsonResponse(finishedResponse); // TODO if we do the realtime parsing stream thing, parseJsonResponse will handle partial json
        const codeChangeList: CodeChange[] = parsedData.codeChanges;

        let currentRenderCode = renderCode;    // we keep a local copy of the code and only update the state at the end
        // 2. Replace the code pieces from the render code
        for (const codeChange of codeChangeList) {

            try {
                const originalCodePiece = removeEscapedChars(codeChange.originalCode.replaceAll("'", "\""));
                const replacementCodePiece = removeEscapedChars(codeChange.replacementCode);

            //     const replacementCodeWithComment = `
            // {/* ${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)} replaced code beginnning */}
            // {/* ${originalCodePiece} */}
            // {/* ${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)}${String.fromCodePoint(0x1FAA6)} replaced code end */}
            // {/* ${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)} new code beginnning */}
            // ${replacementCodePiece}
            // {/* ${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)}${String.fromCodePoint(0x1F6A7)} new code end */}
            // `

                const escapeRegExp = (str: string) => {
                    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
                };

                const createFlexiblePattern = (str: string) => {
                    const escapedStr = escapeRegExp(str);
                    return escapedStr
                        .replace(/[\s\n\r]+/g, '\\s*')    // Handle varying whitespace, newlines, and carriage returns
                        .replace(/<\//g, '<\\/?\\s*')     // Make closing slashes optional with optional whitespace
                        .replace(/\/>/g, '\\s*\\/?\\s*>') // Make self-closing slashes optional with optional whitespace
                        .replace(/>/g, '\\s*\\/?>\\s*')           // Allow optional whitespace after closing angle brackets
                        .replace(/</g, '\\s*<');          // Allow optional whitespace before opening angle brackets
                };

                const searchPattern = new RegExp(createFlexiblePattern(originalCodePiece), 'g');

                if (searchPattern.test(currentRenderCode.replaceAll("'", "\""))) {
                    // console.log("replacing code: " + originalCodePiece + ", search pattern: " + searchPattern);
                    // Replace and update the state using the original render code
                    const updatedRenderCode = currentRenderCode.replaceAll("'", "\"").replace(searchPattern, replacementCodePiece);
                    try {
                        currentRenderCode = await formatCode(updatedRenderCode);
                    } catch (err) {
                        console.log("error in format code: " + err);
                        currentRenderCode = updatedRenderCode;  // we just update without formatting it
                    }

                } else {
                    console.log("Cannot find the reg ex in the source renderCode: " + searchPattern);
                    setShowError(true);
                }
            } catch (error) {
                console.log("An error occurred when parsing response. Try again?")
                setShowError(true);
            }
        }

        addRenderCode(currentRenderCode);   // update the state only after everything is replaced, after each api call, add to the renderCode list, which will create a new node

        // 3. add explanations
        const explanations: string = parsedData.explanations;
        addExplanationsNode(explanations, renderCodeBoundingBox);   // TODO set this position to between the old and new render node
    };

    const updateLoadingState = (targetCodeRenderNodeId: string, newState: boolean) => {
        setLoadingStates(items => {
          // Check if the item already exists in the state
          const itemExists = items.some(item => item.id === targetCodeRenderNodeId);
          
          // If the item exists, update its loading state
          if (itemExists) {
            return items.map(item => {
              if (item.id === targetCodeRenderNodeId) {
                return { ...item, loading: newState };
              }
              return item;
            });
          } else {
            // If the item does not exist, add it to the state
            return [...items, { id: targetCodeRenderNodeId, loading: true }];
          }
        });
      };

    // code block to handle API calls
    const handleFetchResponse = async (textPrompt: string, base64Image = "", jsonMode = false, renderCodeBoundingBox: BoundingBox, renderCode: string, loadingId: string) => {

        // set the loading status here
        updateLoadingState(targetCodeRenderNodeId, true);

        setResponse('');

        const controller = new AbortController();
        setAbortController(controller);

        try {
            const messageData = {
                message: textPrompt,
                image: base64Image,
                json_mode: jsonMode
            };

            // call the api and stream
            const response = await fetch('http://127.0.0.1:5000/api/chat', {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                let finalResponse = '';

                while (loopRunner) {
                    const { value, done } = await reader.read();
                    if (done) {
                        loopRunner = false;
                        break;
                    }
                    const decodedChunk = decoder.decode(value, { stream: true });
                    // console.log("new chunk: " + decodedChunk);
                    finalResponse += decodedChunk;
                    setResponse((prevResponse) => prevResponse + decodedChunk);
                }

                processResponse(finalResponse, renderCodeBoundingBox, renderCode);
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Error fetching response from OpenAI API');
                console.log("error openai api call: " + err);
            }

        } finally {
            updateLoadingState(targetCodeRenderNodeId, false);
            setAbortController(null);
        }
    };


    const addExplanationsNode = (explanations: string, renderCodeNodeBoundingBox: BoundingBox) => {

        console.log("Received bbox in flowcomponent: " + JSON.stringify(renderCodeNodeBoundingBox));
        const newXPos = renderCodeNodeBoundingBox.x + renderCodeNodeBoundingBox.width + 200;
        // const newYPos = renderCodeNodeBoundingBox.x + renderCodeNodeBoundingBox.width + 200; // TODO calculate y position based on count of explanationNode
        console.log("newXPos: " + newXPos);
        setNodes((nds) => {
            return nds.concat(
                {
                    id: String(nds.length + 1),
                    type: 'explanationNode',
                    draggable: true,
                    position: { x: newXPos, y: renderCodeNodeBoundingBox.y },
                    data: { text: explanations },
                }
            );
        });
    }

    useEffect(() => {
        console.log("openai api response updated: " + response);
    }, [response])


    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [],
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );
    const onConnect: OnConnect = (connection) => {
        setEdges((eds) => addEdge(connection, eds));
        // when a new node connect to the code render node, update the source code render
        if (connection.targetHandle === "render-t") {
            // TODO handle different node inputs: if it's an subimage node, maybe blend the prominent style in;
            // if it's a whole image node, maybe do some implicit intent reasoning
            console.log("seems like a source node. id: " + connection.source);
            const sourceNode = nodes.find((node) => node.id === connection.source);
            const targetNode = nodes.find((node) => node.id === connection.target);
            if (sourceNode && targetNode) {
                const referenceImageBase64 = sourceNode.data.image;
                const textPrompt = constructTextPrompt(targetNode.data.renderCode, targetCodeDropped);
                console.log("sending the prompt, target code: \n" + targetCodeDropped);
                // console.log("source node confirmed. here is the image: " + referenceImageBase64);
                handleFetchResponse(textPrompt, referenceImageBase64, false, targetRenderCodeNodeBbox ? targetRenderCodeNodeBbox : defaultBoundingBox, targetNode.data.renderCode, targetCodeRenderNodeId);  // TODO Add the bbox of rendercode node
            } else {
                console.log("Error: cannot find source node. current nodes: \n" + nodes);
            }
        }
        console.log("connection added: \n" + JSON.stringify(connection));
    };

    const createSubImages = (sourceId: string, imageUrlList: string[]) => {

        let currentNode: Node | undefined;
        let newNodeId: number | undefined;

        setNodes((nds) => {
            currentNode = nds.find(node => node.id === sourceId);
            newNodeId = nds.length + 1;
            return nds;
        })

        let currentRightEdge = 1500;
        if (currentNode && currentNode.width) {
            currentRightEdge = currentNode.position.x + currentNode.width;
        } else {
            console.log("Cannot find the node with target id " + sourceId);
        }

        imageUrlList.forEach((imageUrl, index) => {
            if (newNodeId !== undefined) {
                const validNewNodeId: string = newNodeId.toString();
                setNodes((nds) => {
                    console.log("Creating new node for image at index " + index);
                    return nds.concat(
                        {
                            id: validNewNodeId,
                            type: 'subimageNode',
                            draggable: true,
                            position: { x: currentRightEdge + 100, y: (nodes.length + index) * 100 + 100 },
                            data: { image: imageUrl, isDragging: isDragging, setIsDragging: setIsDragging, setNewConfirmationPopupNodeDataPackage: setNewConfirmationPopupNodeDataPackage },
                        }
                    );
                });

                const newEdge = {
                    id: `e${sourceId}-${newNodeId}`,
                    source: sourceId,
                    target: validNewNodeId,
                };

                setEdges((eds) => addEdge(newEdge, eds));
            }
        });
    }

    const removeNode = (id: string) => {
        setNodes((nds) => nds.filter(node => node.id !== id));
    }

    const showBlendingConfirmationPopup = (popUpPosition: coordinatePositionType, viewportX: number, viewportY: number, zoom: number, subImageScreenshot: string) => {

        const posX = (popUpPosition.x - viewportX) / zoom;  // adjust for window transform and zoom for react flow
        const posY = (popUpPosition.y - viewportY) / zoom;
        console.log("current zoom: " + zoom);
        console.log("adjusted for zoom pos: x: " + posX + ", y: " + posY);

        if (posX !== 0 && posY !== 0) {

            setNodes((nds) => {
                const newNodeId = nds.length + 1;
                // console.log("Creating blend confirmation popup with id " + newNodeId);
                return nds.concat(
                    {
                        id: newNodeId.toString(),
                        type: 'confirmationPopupNode',
                        draggable: true,
                        position: { x: posX, y: posY },
                        data: {
                            position: popUpPosition,
                            removeNode: removeNode,
                            renderCode: targetBlendCode,
                            targetCodeDropped: targetCodeDropped,
                            callOpenAI: handleFetchResponse,
                            targetCodeRenderNodeId: targetCodeRenderNodeId,
                            subImageScreenshot: subImageScreenshot,
                            targetRenderCodeNodeBbox: targetRenderCodeNodeBbox,
                        },
                    }
                );
            });
        }

    }

    // when the blendingOptionPosition changes, that means we can show the popup
    useEffect(() => {
        showBlendingConfirmationPopup(newConfirmationPopupNodeDataPackage.mousePosition, x, y, zoom, newConfirmationPopupNodeDataPackage.subImageScreenshot);

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
                type: 'imageDisplayNode',
                draggable: true,
                position: { x: 800, y: nds.length * 100 + 100 },
                data: { image: imageUrl, onSubImageConfirmed: createSubImages },
            })
        );

        console.log("Image node added, current node length: " + nodes.length);
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


    const panOnDrag = [1, 2];   // useful for figma like interaction

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes.map(node => {
                    if (node.type === 'imageUploadNode') {
                        return { ...node, data: { ...node.data, onUpload: importImage } };
                    } else if (node.type === 'codeRenderNode') {
                        return {
                            ...node,
                            data: {
                                ...node.data, toggleCodePanelVisible: toggleCodePanelVisible, codePanelVisible: codePanelVisible,
                                isDragging: isDragging, setTargetBlendCode: setTargetBlendCode, setDisplayCode: setDisplayCode,
                                setTargetCodeDropped: setTargetCodeDropped, setTargetRenderCodeNodeBbox: setTargetRenderCodeNodeBbox,
                                setTargetCodeRenderNodeId: setTargetCodeRenderNodeId, loadingStates: loadingStates, updateLoadingState: updateLoadingState, abortController: abortController
                            }
                        }
                    } else if (node.type === 'imageDisplayNode') {
                        return { ...node, data: { ...node.data, onSubImageConfirmed: createSubImages } }
                    } else {
                        return node;
                    }
                }
                )}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeDragThreshold={4}
                minZoom={0.1}
                panOnScroll
                selectionOnDrag
                panOnDrag={panOnDrag}
                selectionMode={SelectionMode.Partial}
                defaultEdgeOptions={defaultEdgeOptions}>
                <Background />
                <Controls />
                {showCodePanel(displayCode)}
                <div>
                    {showError && (
                        <ErrorPopup
                            message="Oops! That did not work as planned. Try again?"
                        />
                    )}
                </div>
            </ReactFlow>
        </div>
    )
}

export default FlowComponent;