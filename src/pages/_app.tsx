import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): string | void => {
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
      <Component {...pageProps} />
    </ReactFlowProvider>
  );
} 