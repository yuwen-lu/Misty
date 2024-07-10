import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowComponent from './components/FlowComponent';



const App: React.FC = () => {

  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}

export default App;