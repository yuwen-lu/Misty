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
import SubImageNode from './components/SubImageNode';
import 'reactflow/dist/style.css';
import './index.css';



const initialNodes: Node[] = [
  {
    id: '1',
    type: 'imageUploadNode',
    position: { x: 250, y: 100 },
    data: { onUpload: () => { } },
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
};

const App: React.FC = () => {

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

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

  const createSubImages = (id: string, imageUrlList: string[]) => {
    setNodes((nds) =>
      nds.concat(
        imageUrlList.map((imageUrl, index) => ({
          id: `${nds.length + index + 1}`,
          type: 'subimageNode',
          draggable: true,
          position: { x: 1500, y: (nds.length + index) * 100 + 100 },
          data: { image: imageUrl },
        }))
      )
    );
    // TODO add edges too
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
        draggable: false,
        position: { x: 800, y: nds.length * 100 + 100 },
        data: { image: imageUrl, onSelectionConfirmed: createSubImages },
      })
    );
  };


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes.map(node =>
          node.type === 'imageUploadNode'
            ? { ...node, data: { ...node.data, onUpload: importImage } }
            : node
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
      </ReactFlow>
    </div>
  );
}

export default App;