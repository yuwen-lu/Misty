import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';
import { CoinProvider, useCoins } from '../contexts/CoinContext';
import { ChatProvider } from '../contexts/ChatContext';
import CoinDisplay from '../components/CoinDisplay';
import FeatureDiscoveryBanner from '../components/FeatureDiscoveryBanner';

// Inner component that has access to CoinContext
const AppContent: React.FC<{ Component: React.ComponentType<any>; pageProps: any }> = ({
  Component,
  pageProps
}) => {
  const { discoveredFeature, clearDiscoveredFeature } = useCoins();
  const [showFeatureBanner, setShowFeatureBanner] = useState(false);
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);

  // Handle feature discovery
  useEffect(() => {
    if (discoveredFeature) {
      setShowFeatureBanner(true);
      setHighlightedFeature(discoveredFeature.id);
      
      // Clear highlighted feature after 6 seconds (banner auto-closes after 6s)
      const timer = setTimeout(() => {
        setHighlightedFeature(null);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [discoveredFeature]);

  const handleCloseBanner = () => {
    setShowFeatureBanner(false);
    clearDiscoveredFeature();
  };

  return (
    <>
      <Component {...pageProps} />
      <CoinDisplay 
        highlightFeatureId={highlightedFeature}
        forceShowMenu={!!highlightedFeature}
      />
      <FeatureDiscoveryBanner
        isVisible={showFeatureBanner && !!discoveredFeature}
        onClose={handleCloseBanner}
        feature={discoveredFeature || { name: '', icon: '', cost: 0, description: '' }}
      />
    </>
  );
};

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
    <CoinProvider>
      <ChatProvider>
        <ReactFlowProvider>
          <AppContent Component={Component} pageProps={pageProps} />
        </ReactFlowProvider>
      </ChatProvider>
    </CoinProvider>
  );
} 