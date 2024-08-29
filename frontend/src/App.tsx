import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowComponent from './components/FlowComponent';



const App: React.FC = () => {

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) : string | void => {
      // Standard message (some browsers override this)
      const message = "Are you sure you want to leave? Changes you made may not be saved.";
      event.returnValue = message; // For most browsers
      return message; // For some browsers
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);


  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}

export default App;