import React, { useState, useEffect, useCallback } from 'react';
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
import 'reactflow/dist/style.css';


const nodeTypes: NodeTypes = {
  imageUploadNode: ImageUploadNode,
  imageDisplayNode: ImageDisplayNode,
};


const initialNodes: Node[] = [
  {
    id: '1',
    data: { label: 'Hello' },
    position: { x: 0, y: 0 },
    type: 'input',
  },
  {
    id: '2',
    data: { label: 'World' },
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    type: 'imageUploadNode',
    position: { x: 250, y: 100 },
    data: { onUpload: () => { } },
  }
];

const initialEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2', label: 'to the', type: 'step' },
];

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
};

const App: React.FC = () => {

  const [response, setResponse] = useState<string>('');

  useEffect(() => {
    // Example message data
    const messageData = {
      username: "test_user",
      text: "Hello, this is a test message."
    };

    fetch('http://127.0.0.1:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    })
      .then(res => res.json())
      .then(data => setResponse(data.message))
      .catch(error => console.error('Error:', error));
  }, []);
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


  const handleUpload = (id: string, imageUrl: string) => {
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
        position: { x: 250, y: nds.length * 100 + 100 },
        data: { image: imageUrl },
      })
    );
  };


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes.map(node =>
          node.type === 'imageUploadNode'
            ? { ...node, data: { ...node.data, onUpload: handleUpload } }
            : node
        )}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}>
        <Background />
        <Controls />
      </ReactFlow>

      {/* <h1>OpenAI Response</h1>
      <p>{response}</p> */}
    </div>
  );
}

export default App;