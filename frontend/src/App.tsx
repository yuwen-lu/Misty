import React, {useState, useEffect} from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Hello' }, type: 'input' },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'World' } },
];

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
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* <ReactFlow nodes={nodes}>
        <Background />
        <Controls />
      </ReactFlow> */}

      <h1>OpenAI Response</h1>
      <p>{response}</p>
    </div>
  );
}

export default App;