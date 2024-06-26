import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  DefaultEdgeOptions,
} from 'reactflow';
import ImageDisplayNode from './components/ImageDisplayNode';
import ImageUploadNode from './components/ImageUploadNode';
import CodeRenderNode from './components/CodeRenderNode';
import SubImageNode from './components/SubImageNode';
import CodeEditorPanel from './components/CodeEditorPanel';
import { FidelityNaturalHeader } from './components/tempComponents/FidelityNaturalHeader';
import 'reactflow/dist/style.css';
import './index.css';



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

const nodeTypes: NodeTypes = {
  imageUploadNode: ImageUploadNode,
  imageDisplayNode: ImageDisplayNode,
  subimageNode: SubImageNode,
  codeRenderNode: CodeRenderNode,
};

const App: React.FC = () => {

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [codePanelVisible, setCodePanelVisible] = useState<boolean>(false);
  const [renderCode, setRenderCode] = useState<string>(FidelityNaturalHeader);

  useEffect( () => {
    console.log("Render code changed in app.tsx");
  }, [renderCode])

  const toggleCodePanelVisible = () => {
    setCodePanelVisible(!codePanelVisible);
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [],
  );

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
              data: { image: imageUrl },
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


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes.map(node => {
          if (node.type === 'imageUploadNode') {
            return { ...node, data: { ...node.data, onUpload: importImage } };
          } else if (node.type === 'codeRenderNode') {
            return { ...node, data: { ...node.data, renderCode: renderCode, setRenderCode: setRenderCode, toggleCodePanelVisible: toggleCodePanelVisible, codePanelVisible: codePanelVisible } }
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
        <CodeEditorPanel code={renderCode} setCode={setRenderCode} isVisible={codePanelVisible} setCodePanelVisible={setCodePanelVisible}/>
      </ReactFlow>
    </div>
  );
}

export default App;