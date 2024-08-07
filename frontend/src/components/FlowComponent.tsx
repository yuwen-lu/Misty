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
import DynamicUI from './customNodes/DynamicUI';
import CodeEditorPanel from './CodeEditorPanel';
import 'reactflow/dist/style.css';
import '../index.css';
import { removeEscapedChars, coordinatePositionType, BoundingBox, defaultBoundingBox, formatCode, loadingIdState, codeRenderNodeContent } from "../util";
import { parseResponse, constructTextPrompt, parseReplacementPromptResponse, CodeChange, ParsedData, ParsedGlobalBlendingData, Change, CategorizedChange } from '../prompts';
import ErrorPopup from './ErrorPopup';
import { appleMapListBase64, appleFitness, groupedTableViewOrange } from '../images';
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
        data: { image: groupedTableViewOrange },
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
        position: { x: 900, y: 700 },
        data: { image: appleFitness },
    },
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
    const [renderCodeContentList, setRenderCodeContentListState] = useState<codeRenderNodeContent[]>([{ code: BookList, prevCode: "", nodeId: "code-0", categorizedChanges: [] }]);
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

    const setRenderCodeContentList = useCallback((newCodeContentList: codeRenderNodeContent[]) => {
        setRenderCodeContentListState(newCodeContentList);
    }, []);

    const addRenderCodeContent = useCallback((newContent: codeRenderNodeContent) => {
        setRenderCodeContentListState((prevList) => [...prevList, newContent]);
    }, []);

    const updateDisplayCode = (newCode: string) => {
        setDisplayCode((displayCode) => {
            // Update the code in the list when code editor updates
            setRenderCodeContentListState((prevList) => {
                return prevList.map((content) => {
                    return {
                        ...content,
                        code: content.code.trim() === displayCode.trim() ? newCode : content.code,
                    };
                });
            });
            return newCode;
        })
    };

    // Function to get initial positions for nodes
    const getInitialPositions = () => {
        return renderCodeContentList.map((_, idx) => ({
            x: 2200 + 1000 * idx,
            y: 100
        }));
    };

    const getCodeRenderNodes = (initialPositions: coordinatePositionType[]) => {
        return renderCodeContentList.map((renderContent, idx) => {
            const renderCode = renderContent.code.replaceAll(`{" "}`, "");  // sometimes there are weird formatting issues that inserts this empty string to the formatted code
            const newNodeId = renderContent.nodeId ? renderContent.nodeId : "code-" + nodes.length; // TODO This is a hack
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
                        response: response,
                        renderCode: renderCode,
                        prevCode: renderContent.prevCode,
                        blendedCode: renderCode,    // when we create a new node, we record its original updated code after blending, so we can reset when needed
                        categorizedChanges: renderContent.categorizedChanges
                    },
                };
            }
        });
    };

    // TODO Urgent helper function can be removed
    const printCodeRenderNodeContentList = (list: codeRenderNodeContent[]) => {
        list.forEach((item, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`  Code: ${item.code}`);
            console.log(`  Prev Code: ${item.prevCode}`);
            console.log(`  Node ID: ${item.nodeId}`);
            console.log(`  Categorized Changes:`);
            item.categorizedChanges.forEach((change, changeIndex) => {
                console.log(`    Change ${changeIndex + 1}:`);
                console.log(`      Category: ${change.category}`);
                change.changes.forEach((c, cIndex) => {
                    console.log(`      Change ${cIndex + 1}: Before: ${c.before}, After: ${c.after}`);
                });
            });
        });
    };
    

    // Initialize nodes with positions, and update whenever the code list gets updated
    useEffect(() => {
        setNodes((nodes) => [...nodes, ...getCodeRenderNodes(getInitialPositions())]);
        console.log("renderCodeContentList updated: ");
        printCodeRenderNodeContentList(renderCodeContentList);
    }, [renderCodeContentList]);

    const processReplacementPromptResponse = async (finishedResponse: string, renderCodeBoundingBox: BoundingBox, renderCode: string) => {
        // when reposne is updated from the api call, we post process it
        // 1. fetch the parsed Result
        const parsedData: ParsedData = parseReplacementPromptResponse(finishedResponse); // TODO if we do the realtime parsing stream thing, parseReplacementPromptResponse will handle partial json
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
        // 3. add explanations  TODO now it might be the field of "changes"
        const explanations: string = parsedData.explanations;
        addExplanationsNode([explanations], renderCodeBoundingBox);   // TODO set this position to between the old and new render node, plus the explanation format is now different

        // URGENT TODO COME BACK AND FIX THIS, PLUS TEST AGAIN THE WHOLE FUNCTION
        // const newRenderCodeContent: codeRenderNodeContent = {
        //     code: currentRenderCode,
        //     changes: explanations
        // };

        // addRenderCodeContent(newRenderCodeContent);   // update the state only after everything is replaced, after each api call, add to the renderCode list, which will create a new node

    };

    const processGlbalBlendingResponse = async (finishedResponse: string, renderCodeBoundingBox: BoundingBox, renderCode: string) => {
        // 1. fetch the parsed Result
        const parsedData: ParsedGlobalBlendingData = parseResponse(finishedResponse);
        let updatedCode = parsedData.updatedCode.trim();

        // Check if updatedCode is wrapped in backticks
        if (updatedCode.startsWith('`') && updatedCode.endsWith('`')) {
            // Remove the backticks
            updatedCode = updatedCode.slice(1, -1);
        }

        // Check if updatedCode does not start with () =>
        if (!updatedCode.startsWith('() =>')) {
            // Find the index of () =>
            const arrowFunctionIndex = updatedCode.indexOf('() =>');

            // If () => is found, slice the code from that point
            if (arrowFunctionIndex !== -1) {
                updatedCode = updatedCode.slice(arrowFunctionIndex);
            }
        }



        // Remove extra closing parentheses if present
        const extraParenthesesPattern = /\)\s*\)\s*;\s*\};$/;
        if (extraParenthesesPattern.test(updatedCode)) {
            updatedCode = updatedCode.replace(extraParenthesesPattern, ');\n};');
        }

        // Define the regex pattern to check the desired format
        const regexPattern = /^\(\)\s*=>\s*\{\s*([\s\S]*?)\s*\};?$/;

        // Test if the updatedCode matches the regex pattern
        if (!regexPattern.test(updatedCode.trim())) {
            // Handle the case where the code does not match the desired format
            console.log('code does not match the desired format in regex');
            setShowError(true);
        }

        console.log("displaying...\n" + parsedData)

        const categorizedChanges: CategorizedChange[] = parsedData.categorizedChanges;

        const newRenderCodeContent: codeRenderNodeContent = {
            code: updatedCode,
            prevCode: renderCode,
            nodeId: `code-${renderCodeContentList.length}`,
            categorizedChanges: categorizedChanges
        }

        addRenderCodeContent(newRenderCodeContent);
        // addExplanationsNode(changes, renderCodeBoundingBox);   // TODO fix this set this position to between the old and new render node

    };

    const handleCodeReplacement = (nodeId: string, newCode: string) => {
        setRenderCodeContentListState((renderCodeList: codeRenderNodeContent[]) =>
            renderCodeList.map((renderCodeContent: codeRenderNodeContent) =>
                renderCodeContent.nodeId === nodeId ? {
                    ...renderCodeContent,
                    code: newCode.replaceAll(`{" "}`, "")
                } : renderCodeContent
            ));
    };    


    const updateLoadingState = (targetCodeRenderNodeId: string, newState: boolean) => {
        console.log("updating state with target code id: " + targetCodeRenderNodeId);
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
    const handleFetchResponse = async (textPrompt: string, base64Image = "", jsonMode = false, renderCodeBoundingBox: BoundingBox, renderCode: string, targetNodeId = "", globalBlending = false) => {

        // set the loading status here
        targetNodeId === "" ? updateLoadingState(targetCodeRenderNodeId, true) : updateLoadingState(targetNodeId, true);

        console.log("calling api, node " + targetCodeRenderNodeId + " started! ");
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

                console.log("Handle fetch response render code: " + renderCode);

                globalBlending ? processGlbalBlendingResponse(finalResponse, renderCodeBoundingBox, renderCode) : processReplacementPromptResponse(finalResponse, renderCodeBoundingBox, renderCode);
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Error fetching response from OpenAI API');
                console.log("error openai api call: " + err);
            }

        } finally {
            targetNodeId === "" ? updateLoadingState(targetCodeRenderNodeId, false) : updateLoadingState(targetNodeId, false);
            setAbortController(null);
        }
    };


    const addExplanationsNode = (explanations: Change[] | string[], renderCodeNodeBoundingBox: BoundingBox) => {

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
        // update the coderendernode to display generation progress
        setNodes((nds) =>
            nds.map((node) =>
                node.type === "codeRenderNode"
                    ? { ...node, data: { ...node.data, response: response } }
                    : node
            )
        );
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
                // console.log("setting targetNodeId, " + targetNode.id)
                setTargetCodeRenderNodeId(targetNode.id);
                const referenceImageBase64 = sourceNode.data.image;
                const textPrompt = constructTextPrompt(targetNode.data.renderCode);
                // we have to pass the targetNode.id in here because of some weird state not updating & async function call issues
                handleFetchResponse(textPrompt, referenceImageBase64, true, targetRenderCodeNodeBbox ? targetRenderCodeNodeBbox : defaultBoundingBox, targetNode.data.renderCode, targetNode.id, true);  // TODO Add the bbox of rendercode node
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
                                setTargetCodeRenderNodeId: setTargetCodeRenderNodeId, loadingStates: loadingStates,
                                updateLoadingState: updateLoadingState, abortController: abortController,
                                handleCodeReplacement: handleCodeReplacement
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
            {/* <TSXDiff /> */}
        </div>
    )
}

export default FlowComponent;