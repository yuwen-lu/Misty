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
} from 'reactflow';
import ImageDisplayNode from './components/customNodes/ImageDisplayNode';
import ImageUploadNode from './components/customNodes/ImageUploadNode';
import ExplanationNode from './components/customNodes/ExplanationNode';
import CodeRenderNode from './components/customNodes/CodeRenderNode';
import SubImageNode from './components/customNodes/SubImageNode';
import ConfirmationPopupNode from './components/customNodes/ConfirmationPopupNode';
import CodeEditorPanel from './components/CodeEditorPanel';
import { FidelityNaturalHeader } from './components/renderCode/FidelityNaturalHeader';
import 'reactflow/dist/style.css';
import './index.css';
import { parseResponse } from './util';

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
    position: { x: 750, y: 100 },
    data: { code: FidelityNaturalHeader, setCodePanelVisible: null },
  }
];

const initialEdges: Edge[] = [
];

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
};


const App: React.FC = () => {

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isDragging, setIsDragging] = useState(false);  // when we drag subimagenode (washi tape)
  const [blendingOptionPosition, setBlendingOptionPosition] = useState({ x: 0, y: 0 });
  const [codePanelVisible, setCodePanelVisible] = useState<boolean>(false);
  const [renderCode, setRenderCodeState] = useState<string>(FidelityNaturalHeader);

  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
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
    setError("");
    try {
      const response = await getOpenAIResponse(textPrompt, base64Image);
      console.log("raw response:" + response);
      setResponse(response);
      const [responseCode, changeExplanations] = parseResponse(response);
      setRenderCode(responseCode);
      addExplanationsNode(changeExplanations);
    } catch (err) {
      setError('Error fetching response from OpenAI API');
      console.log("error openai api call: " + err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    console.log("openai api response updated: " + response);
  }, [response])


  // TODO Remove this test log
  useEffect(() => {
    console.log("App tsx is dragging changed: " + isDragging);
  }, [isDragging])

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
        const textPrompt = `Here is my react and tailwind code: 
          
          ${renderCode}. 
          
          Help me blend the prominent color of the reference image into the react code. a few rules:

          1. return the updated component code only;
          2. only use tailwind, react, and react icons. Follow the current code structure, do not include any export or import statements, just use a simple component definition () => {}
          3. Explain what you changed. In your response, use the format "Explanations:" followed by a numbered list of items. Be very concise in your explanations. For example, "Color change: section titles, from green to purple"
          
          `
        console.log("source node confirmed. here is the image: " + referenceImageBase64);
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
              data: { image: imageUrl, isDragging: isDragging, setIsDragging: setIsDragging, setBlendingOptionPosition: setBlendingOptionPosition },
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

  const showBlendingConfirmationPopup = (popUpPosition: popUpPositionType) => {
    const posX = popUpPosition.x;
    const posY = popUpPosition.y;

    if (posX !== 0 && posY !== 0) {

      setNodes((nds) => {
        const newNodeId = nds.length + 1;
        console.log("Creating blend confirmation popup with id " + newNodeId);
        return nds.concat(
          {
            id: newNodeId.toString(),
            type: 'confirmationPopupNode',
            draggable: true,
            position: { x: posX, y: posY },
            data: { setConfirmationSelection: (selectedOptions: string[]) => console.log("selected: " + selectedOptions.join(", ")) },  // TODO Change this function
          }
        );
      });
    }

  }

  // when the blendingOptionPosition changes, that means we can show the popup
  useEffect(() => {
    showBlendingConfirmationPopup(blendingOptionPosition);
  }, [blendingOptionPosition]);

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
              data: { ...node.data, code: renderCode, setCode: setRenderCode, toggleCodePanelVisible: toggleCodePanelVisible, codePanelVisible: codePanelVisible }
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
  );
}

export default App;