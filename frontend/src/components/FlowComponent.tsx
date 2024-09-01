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
import { removeEscapedChars, coordinatePositionType, BoundingBox, defaultBoundingBox, formatCode, loadingIdState, codeRenderNodeContent, blurImage } from "../util";
import { parseResponse, constructTextPrompt, parseReplacementPromptResponse, CodeChange, ParsedData, ParsedGlobalBlendingData, Change, CategorizedChange } from '../prompts';
import ErrorPopup from './ErrorPopup';
import { bottomModalBase64, bottomModalGreenBase64, appleTvCard, appleTvHero, appleTvHeroFull, appleNewsMySportsBase64, appleMusicPlayNextBase64, appleNewsCards, appleBookStore, appleNewsTrending, appleMusicPlay, appleBookReadingNow, sketchLayout, sketchHeaderLayout } from '../images';
import { BookList } from './renderCode/BookList';
import ButtonEdge from './ButtonEdge';
import { TrailList } from './renderCode/TrailList';
import { RestaurantSearch } from './renderCode/RestaurantSearch';
import { AppSettings } from './renderCode/AppSettings';
import { PhoneApp } from './renderCode/PhoneApp';

const nodeTypes: NodeTypes = {
    imageUploadNode: ImageUploadNode,
    imageDisplayNode: ImageDisplayNode,
    subimageNode: SubImageNode,
    explanationNode: ExplanationNode,
    codeRenderNode: CodeRenderNode,
    confirmationPopupNode: ConfirmationPopupNode,
};

const edgeTypes = {
    button: ButtonEdge,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'imageUploadNode',
        position: { x: 150, y: 100 },
        data: { onUpload: () => { } },
    },
    // {
    //     id: "2",
    //     type: 'imageDisplayNode',
    //     draggable: true,
    //     position: { x: 800, y: 100 },
    //     data: { image: appleTvHeroFull },
    // },
    // {
    //     id: "3",
    //     type: 'imageDisplayNode',
    //     draggable: true,
    //     position: { x: 1300, y: 100 },
    //     data: { image: appleTvHero },
    // },
    {
        id: "2",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 1800, y: 100 },
        data: { image: appleTvCard },
    },
    // {
    //     id: "5",
    //     type: 'imageDisplayNode',
    //     draggable: true,
    //     position: { x: 800, y: 1000 },
    //     data: { image: appleNewsMySportsBase64 },
    // },
    // {
    //     id: "6",
    //     type: 'imageDisplayNode',
    //     draggable: true,
    //     position: { x: 1300, y: 1000 },
    //     data: { image: appleMusicPlayNextBase64 },
    // },
    {
        id: "3",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 1800, y: 1000 },
        data: { image: appleNewsCards },
    },
    {
        id: "4",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 1200, y: 800 },
        data: { image: appleBookStore },
    },
    {
        id: "5",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 2400, y: 1400 },
        data: { image: bottomModalBase64 },
    },
    {
        id: "6",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 2400, y: 500 },
        data: { image: bottomModalGreenBase64 },
    },
    {
        id: "7",
        type: 'imageDisplayNode',
        draggable: true,
        position: { x: 400, y: 1000 },
        data: { image: sketchHeaderLayout },
    }
];

const initialEdges: Edge[] = [
];

const initialConfirmationPopupNodeDataPackage = {
    mousePosition: {
        x: 0,
        y: 0,
    },
    subImageScreenshot: "",
    sourceNodeId: ""
}

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
};

const initialCodeToRender: codeRenderNodeContent[] = [
    { code: BookList, prevCode: "", nodeId: "code-0", categorizedChanges: [], sourceNodeId: "", textPrompt: "", base64Image: "" },
    { code: TrailList, prevCode: "", nodeId: "code-1", categorizedChanges: [], sourceNodeId: "", textPrompt: "", base64Image: "" },
    { code: RestaurantSearch, prevCode: "", nodeId: "code-2", categorizedChanges: [], sourceNodeId: "", textPrompt: "", base64Image: "" },
    { code: AppSettings, prevCode: "", nodeId: "code-3", categorizedChanges: [], sourceNodeId: "", textPrompt: "", base64Image: "" },
    { code: PhoneApp, prevCode: "", nodeId: "code-4", categorizedChanges: [], sourceNodeId: "", textPrompt: "", base64Image: "" },
];

// const fetchResponseUrl = 'http://localhost:5000/api/chat';
const fetchResponseUrl = 'http://ylu48-default.siri-interactive-vm.svc.kube.us-west-3b.k8s.cloud.apple.com:5000/api/chat';

const FlowComponent: React.FC = () => {

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [isDragging, setIsDragging] = useState(false);  // when we drag subimagenode (washi tape)
    const [newConfirmationPopupNodeDataPackage, setNewConfirmationPopupNodeDataPackage] = useState(initialConfirmationPopupNodeDataPackage);
    const [codePanelVisible, setCodePanelVisible] = useState<boolean>(false);
    const [renderCodeContentList, setRenderCodeContentListState] = useState<codeRenderNodeContent[]>(initialCodeToRender);
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
                        code: content.code.trim() === displayCode.trim() ? newCode.replaceAll(`{" "}`, "") : content.code,
                    };
                });
            });
            return newCode;
        })
    };

    // Function to get initial positions for nodes
    const getInitialPositions = () => {
        const nodesPerRow = 3; // Number of nodes per row
        const horizontalSpacing = 800; // Spacing between nodes horizontally
        const verticalSpacing = 1200; // Spacing between nodes vertically
        const startX = 3200; // Initial x position
        const startY = 300;  // Initial y position

        return renderCodeContentList.map((_, idx) => {
            const row = Math.floor(idx / nodesPerRow); // Determine the current row
            const col = idx % nodesPerRow; // Determine the current column

            return {
                x: startX + col * horizontalSpacing, // Calculate x based on column
                y: startY + row * verticalSpacing,    // Calculate y based on row
            };
        });
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
                        blendedCode: renderContent.blendedCode ? renderContent.blendedCode : existingNode.data.blendedCode,     // only update when the field is set, the field is only set through re-generation
                        categorizedChanges: renderContent.categorizedChanges,
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
                        categorizedChanges: renderContent.categorizedChanges,
                        textPrompt: renderContent.textPrompt,
                        base64Image: renderContent.base64Image,
                        sourceNodeId: renderContent.sourceNodeId,
                    },
                };
            }
        });
    };

    // Initialize nodes with positions, and update whenever the code list gets updated. usememo can avoid performance issues
    const memoizedNodes = useMemo(() => getCodeRenderNodes(getInitialPositions()), [renderCodeContentList]);

    useEffect(() => {
        setNodes((prevNodes) => {
            // Create a new list of nodes by either keeping the existing one or replacing it if necessary
            const updatedNodes = memoizedNodes.map((newNode) => {
                const existingNode = prevNodes.find((n) => n.id === newNode.id);
                if (existingNode) {
                    if (existingNode.data.renderCode !== newNode.data.renderCode) {
                        console.log("Updating node with id " + newNode.id + " due to code change...");
                        return newNode; // Replace with updated node
                    } else {
                        return existingNode; // Keep the existing node
                    }
                } else {
                    console.log("Adding new node with id " + newNode.id + "...");
                    return newNode; // Add new node
                }
            });

            // Include any nodes from prevNodes that weren't in memoizedNodes
            const remainingOldNodes = prevNodes.filter(
                (oldNode) => !memoizedNodes.some((newNode) => newNode.id === oldNode.id)
            );

            return [...remainingOldNodes, ...updatedNodes];
        });
    }, [memoizedNodes]);


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
        // URGENT TODO COME BACK AND FIX THIS, PLUS TEST AGAIN THE WHOLE FUNCTION
        // 3. add explanations  
        const explanations: string = parsedData.explanations;
        addExplanationsNode([explanations], renderCodeBoundingBox);   // TODO set this position to between the old and new render node, plus the explanation format is now different

        // const newRenderCodeContent: codeRenderNodeContent = {
        //     code: currentRenderCode,
        //     changes: explanations
        // };

        // addRenderCodeContent(newRenderCodeContent);   // update the state only after everything is replaced, after each api call, add to the renderCode list, which will create a new node

    };

    const processParsedCode = (code: string) => {
        let updatedCode = code.trim().replaceAll(/`/g, "");

        // Check if updatedCode does not start with () =>
        if (!updatedCode.startsWith('() =>')) {
            // Find the index of () =>
            const arrowFunctionIndex = updatedCode.indexOf('() =>');

            // If () => is found, slice the code from that point
            if (arrowFunctionIndex !== -1) {
                updatedCode = updatedCode.slice(arrowFunctionIndex);
            }
        }

        if (updatedCode.includes('export')) {
            updatedCode = updatedCode.split('export')[0];
        }

        updatedCode = updatedCode.replaceAll("fixed", "absolute");    // the previous will mess up react live

        // Remove extra closing parentheses if present
        const extraParenthesesPattern = /\)\s*\)\s*;\s*\};$/;
        if (extraParenthesesPattern.test(updatedCode)) {
            updatedCode = updatedCode.replace(extraParenthesesPattern, ');\n};');
        }

        // Define the regex pattern to check the desired format
        const regexPattern = /^\(\)\s*=>\s*\{\s*([\s\S]*?)\s*\};?$/;

        // Test if the updatedCode matches the regex pattern
        // TODO if this does not match the format, maybe we should just return null?
        if (!regexPattern.test(updatedCode)) {
            // Handle the case where the code does not match the desired format
            console.log('code does not match the desired format in regex');
            setShowError(true);
        }

        console.log("still contains backticks after formatting? " + updatedCode.includes("`"));
        return updatedCode;
    }

    const processGlbalBlendingResponse = async (finishedResponse: string, renderCodeBoundingBox: BoundingBox, renderCode: string, textPrompt: string, base64Image: string, sourceNodeId: string) => {
        // fetch the parsed Result
        const parsedData: ParsedGlobalBlendingData = parseResponse(finishedResponse);
        let updatedCode = processParsedCode(parsedData.updatedCode);

        try {
            updatedCode = await formatCode(updatedCode);
        } catch (err) {
            console.log("error in format code: " + err);
        }

        console.log("displaying updated code...\n" + parsedData)

        const categorizedChanges: CategorizedChange[] = parsedData.categorizedChanges;

        const newRenderCodeContent: codeRenderNodeContent = {
            nodeId: `code-${renderCodeContentList.length}`,
            code: updatedCode,
            prevCode: renderCode,
            categorizedChanges: categorizedChanges,
            sourceNodeId: sourceNodeId,
            textPrompt: textPrompt,
            base64Image: base64Image,
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

    const handleFetchResponse = async (textPrompt: string, base64Image = "", jsonMode = true, renderCodeBoundingBox = defaultBoundingBox, renderCode: string, targetNodeId = "", globalBlending = false, sourceNodeId: string, isRegenerate = false) => {

        console.log("Taget node id " + targetNodeId);
        // set the loading status here
        targetNodeId === "" ? updateLoadingState(targetCodeRenderNodeId, true) : updateLoadingState(targetNodeId, true);

        console.log("calling api, node " + targetCodeRenderNodeId + " started! ");
        console.log("prompt: " + textPrompt);
        setResponse('');
        const controller = new AbortController();
        setAbortController(controller);

        try {

            const blurredBase64 = await blurImage(base64Image);

            console.log("processed blurred image: " + blurredBase64);

            const messageData = {
                message: textPrompt,
                image: blurredBase64,
                json_mode: jsonMode
            };

            // call the api and stream
            const response = await fetch(fetchResponseUrl, {
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

                // TODO Figure out how to deal with replacementPrompts
                // globalBlending ? processGlbalBlendingResponse(finalResponse, renderCodeBoundingBox, renderCode) : processReplacementPromptResponse(finalResponse, renderCodeBoundingBox, renderCode);

                if (isRegenerate) {
                    // Fetch the parsed Result
                    const parsedData: ParsedGlobalBlendingData = parseResponse(finalResponse);
                    let updatedCode = processParsedCode(parsedData.updatedCode);

                    // Update the existing renderCodeContentList entry instead of adding a new one
                    console.log("yo, finished fetch response, here's the updated blendedCode: " + updatedCode);
                    setRenderCodeContentListState((prevList) =>
                        prevList.map((content) =>
                            content.nodeId === targetNodeId
                                ? {
                                    ...content,
                                    code: updatedCode, // Update with the processed code
                                    blendedCode: updatedCode,   // this field is optional and only gets set through regeneration 
                                    prevCode: renderCode, // Set the previous code
                                    categorizedChanges: parsedData.categorizedChanges, // Update categorized changes
                                    response: finalResponse, // Store the final response
                                }
                                : content
                        )
                    );
                } else {
                    processGlbalBlendingResponse(finalResponse, renderCodeBoundingBox, renderCode, textPrompt, base64Image, sourceNodeId);
                }

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

    const fixCodeNotRendering = async (code: string, targetNodeId: string) => {

        console.log("Taget node id " + targetNodeId);
        // set the loading status here
        targetNodeId === "" ? updateLoadingState(targetCodeRenderNodeId, true) : updateLoadingState(targetNodeId, true);
        setResponse('');
        const controller = new AbortController();
        setAbortController(controller);

        try {

            const messageData = {
                message: "This piece of code is not rendering properly, please help me fix it. Return only the updated code and nothing else. Use typescript. Follow the format of a simple React component () => {}. \n" + code,
                json_mode: false
            };

            // call the api and stream
            const response = await fetch(fetchResponseUrl, {
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

                finalResponse = processParsedCode(finalResponse);

                setRenderCodeContentListState((prevList) =>
                    prevList.map((content) =>
                        content.nodeId === targetNodeId
                            ? {
                                ...content,
                                code: finalResponse, // Update with the processed code
                                blendedCode: finalResponse,   // this field is optional and only gets set through regeneration 
                            }
                            : content
                    )
                );

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

    const fetchSemanticDiffingResponse = async (code: string, targetNodeId: string, prevCode: string, discardCategory: string, keepCategory: string, addCategory: string) => {
        console.log("Target node id " + targetNodeId);

        // Set the loading status here
        targetNodeId === "" ? updateLoadingState(targetCodeRenderNodeId, true) : updateLoadingState(targetNodeId, true);
        setResponse('');
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const messageData = {
                message: `Now I have this piece of code:\n${code} \n. It was made by changing this piece of code: \n ${prevCode} \n. Generally, these changes were being made: ${discardCategory + ", " + keepCategory}. Can you help me ${discardCategory ? `discard the ${discardCategory}` : ''}${discardCategory && keepCategory ? ', ' : ''}${keepCategory ? `keep the ${keepCategory}` : ''}${addCategory ? ` and add the ${addCategory}` : ''} categories? Return the updated code only, using a simple component format () => {return ()}.`,
                json_mode: false
            };

            // Call the API and stream the response
            const response = await fetch(fetchResponseUrl, {
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

            // Handle streaming response
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
                                blendedCode: finalResponse,   // this field is optional and only gets set through regeneration 
                            }
                            : content
                    )
                );
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
        (changes) => {

            // update nodes
            setNodes((nds) => applyNodeChanges(changes, nds));

            let removedNodeId: string[] = [];
            // remove the code content that corresponds to the node that is removed
            changes.forEach(change => {
                if (change.type === "remove") {
                    setRenderCodeContentListState(list => list.filter(code => code.nodeId !== change.id))
                    removedNodeId.push(change.id);
                }
            })

            // update edges too
            setEdges((eds) => eds.filter(ed => {
                if (ed.sourceNode && ed.targetNode) {
                    return !removedNodeId.includes(ed.sourceNode.id) && !removedNodeId.includes(ed.targetNode.id);
                } else {
                    return true;
                }
            }))
        },
        [],
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );
    const onConnect: OnConnect = (connection) => {
        setEdges((eds) => addEdge(connection, eds));
        console.log("connection added: \n" + JSON.stringify(connection));
        if (connection.targetHandle === "render-t") {
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
                handleFetchResponse(textPrompt, referenceImageBase64, true, targetRenderCodeNodeBbox ? targetRenderCodeNodeBbox : defaultBoundingBox, targetNode.data.renderCode, targetNode.id, true, sourceNode.id);  // TODO Add the bbox of rendercode node
            } else {
                console.log("Error: cannot find source node. current nodes: \n" + nodes);
            }
            setEdges((eds) =>
                eds.filter((e) =>
                    e.source !== connection.source ||
                    e.sourceHandle !== connection.sourceHandle ||
                    e.target !== connection.target ||
                    e.targetHandle !== connection.targetHandle
                )
            );  // remove the edge if it's just connecting to blend
        }

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
        let currentTopEdge = 500;
        if (currentNode && currentNode.width && currentNode.height) {
            currentRightEdge = currentNode.position.x + currentNode.width;
            currentTopEdge = currentNode.position.y;
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
                            position: { x: currentRightEdge + 100, y: currentTopEdge + 100 },
                            data: { image: imageUrl, isDragging: isDragging, setIsDragging: setIsDragging, setNewConfirmationPopupNodeDataPackage: setNewConfirmationPopupNodeDataPackage },
                        }
                    );
                });

                const newEdge = {
                    id: `e-${sourceId}-${newNodeId}`,
                    source: sourceId,
                    target: validNewNodeId,
                };

                setEdges((eds) => addEdge(newEdge, eds));
            }
        });
    }

    const addNewEdge = (edge: Edge) => {
        const edgeExists = edges.find(edg => edg.id === edge.id)
        if (!edgeExists) {
            setEdges((eds) => addEdge(edge, eds));
            console.log("New edge added, id: " + edge.id);
        }
    }

    const removeNode = (id: string) => {
        setNodes((nds) => nds.filter(node => node.id !== id));
    }

    const showBlendingConfirmationPopup = (popUpPosition: coordinatePositionType, viewportX: number, viewportY: number, zoom: number, subImageScreenshot: string, sourceNodeId: string) => {

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
                            handleFetchResponse: handleFetchResponse,
                            targetCodeRenderNodeId: targetCodeRenderNodeId,
                            subImageScreenshot: subImageScreenshot,
                            targetRenderCodeNodeBbox: targetRenderCodeNodeBbox,
                            sourceNodeId: sourceNodeId
                        },
                    }
                );
            });
        }

    }

    // when the blendingOptionPosition changes, that means we can show the popup
    useEffect(() => {
        showBlendingConfirmationPopup(newConfirmationPopupNodeDataPackage.mousePosition, x, y, zoom, newConfirmationPopupNodeDataPackage.subImageScreenshot, newConfirmationPopupNodeDataPackage.sourceNodeId);

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
                position: { x: 800, y: 500 },
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
                                handleCodeReplacement: handleCodeReplacement, addNewEdge: addNewEdge, handleFetchResponse: handleFetchResponse,
                                fixCodeNotRendering: fixCodeNotRendering, fetchSemanticDiffingResponse: fetchSemanticDiffingResponse,
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
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeDragThreshold={4}
                minZoom={0.1}
                panOnScroll
                selectionOnDrag
                panOnDrag={panOnDrag}
                selectionMode={SelectionMode.Partial}
                onlyRenderVisibleElements={false}
                defaultEdgeOptions={defaultEdgeOptions}>
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
            {/* <TSXDiff /> */}
        </div>
    )
}

export default FlowComponent;
