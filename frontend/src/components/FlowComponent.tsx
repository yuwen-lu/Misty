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
    useViewport
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
import { parseResponse } from '../util';
import { constructTextPrompt } from '../prompts';

interface OpenAIResponse {
    response: string;
}

interface popUpPositionType {
    x: number,
    y: number,
}

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
        position: { x: 250, y: 100 },
        data: { onUpload: () => { } },
    },
    {
        id: '2',
        type: 'codeRenderNode',
        position: { x: 2050, y: 100 },
        data: { code: FidelityNaturalHeader, setCodePanelVisible: null },
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
    const [renderCode, setRenderCodeState] = useState<string>(FidelityNaturalHeader);
    const [targetCodeDropped, setTargetCodeDropped] = useState<string>("");

    const { x, y, zoom } = useViewport();
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);  // TODO render code using this loading status

    // code block to handle API calls
    // Async function to fetch data from the API
    const getOpenAIResponse = async (textPrompt: string, base64Image: string): Promise<string> => {
        const messageData = {
            message: textPrompt,
            image: base64Image,
        };

        const response = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: OpenAIResponse = await response.json();
        return data.response;
    };

    const addExplanationsNode = (explanations: string) => {
        setNodes((nds) => {
            return nds.concat(
                {
                    id: String(nds.length + 1),
                    type: 'explanationNode',
                    draggable: true,
                    position: { x: 200, y: 500 },
                    data: { text: explanations },
                }
            );
        });
    }

    const handleFetchResponse = async (textPrompt = "test", base64Image = "") => {
        setLoading(true);
        try {
            const response = await getOpenAIResponse(textPrompt, base64Image);
            console.log("raw response:" + response);
            setResponse(response);
            const [responseCode, changeExplanations] = parseResponse(response);
            setRenderCode(responseCode);
            addExplanationsNode(changeExplanations);
        } catch (err) {
            console.error('Error fetching response from OpenAI API');
            console.log("error openai api call: " + err);
        } finally {
            setLoading(false);
        }
    };


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
            if (sourceNode) {
                const referenceImageBase64 = sourceNode.data.image;
                const textPrompt = constructTextPrompt(renderCode, targetCodeDropped);
                console.log("sending the prompt, target code: \n" + targetCodeDropped);
                // console.log("source node confirmed. here is the image: " + referenceImageBase64);
                handleFetchResponse(textPrompt, referenceImageBase64);
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

    const showBlendingConfirmationPopup = (popUpPosition: popUpPositionType, viewportX: number, viewportY: number, zoom: number, subImageScreenshot: string) => {

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
                            renderCode: renderCode,
                            targetCodeDropped: targetCodeDropped,
                            callOpenAI: handleFetchResponse,
                            subImageScreenshot: subImageScreenshot,
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

    useEffect(() => {
        console.log("the target dropped code updated: " + targetCodeDropped);
    }, [targetCodeDropped])

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


    const toggleCodePanelVisible = () => {
        setCodePanelVisible(!codePanelVisible);
    }

    const setRenderCode = useCallback((newCode: string) => {
        setRenderCodeState(newCode);
    }, []);

    // memorize the code editor panel to avoid unnecessary re-render
    const memoizedCodeEditorPanel = useMemo(() => (
        <CodeEditorPanel
            code={renderCode}
            setCode={setRenderCode}
            isVisible={codePanelVisible}
            setCodePanelVisible={setCodePanelVisible}
        />
    ), [renderCode, setRenderCode, codePanelVisible, setCodePanelVisible]);


    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes.map(node => {
                    if (node.type === 'imageUploadNode') {
                        return { ...node, data: { ...node.data, onUpload: importImage } };
                    } else if (node.type === 'codeRenderNode') {
                        return {
                            ...node,
                            data: { ...node.data, code: renderCode, setCode: setRenderCode, toggleCodePanelVisible: toggleCodePanelVisible, codePanelVisible: codePanelVisible, isDragging: isDragging, setTargetCodeDropped: setTargetCodeDropped }
                        }
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
                defaultEdgeOptions={defaultEdgeOptions}>
                <Background />
                <Controls />
                {memoizedCodeEditorPanel}
            </ReactFlow>
        </div>
    )
}

export default FlowComponent;