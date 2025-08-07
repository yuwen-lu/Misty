import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow';
import { LuExternalLink, LuRefreshCw, LuLink, LuImage, LuPenTool, LuEye } from 'react-icons/lu';
import { CircleAlert } from 'lucide-react';
import { useCoins } from '../../contexts/CoinContext';
import { showInstructionalPopup } from '../../utils/celebration';

const WebsitePreviewNode: React.FC<NodeProps> = React.memo(({ id, data }) => {
  const [url, setUrl] = useState<string>(data.url || '');
  const [inputUrl, setInputUrl] = useState<string>(data.url || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [hasVisited, setHasVisited] = useState<boolean>(false);
  
  // Keep track of the current visibility listener to prevent multiple listeners
  const visibilityListenerRef = React.useRef<(() => void) | null>(null);
  
  const { celebrateCoins, celebrateCoinsWithMessage } = useCoins();

  const formatUrl = (inputUrl: string): string => {
    if (!inputUrl) return '';
    
    if (!/^https?:\/\//i.test(inputUrl)) {
      return `https://${inputUrl}`;
    }
    
    return inputUrl;
  };

  // Function to get screenshot URL from URLBox service
  const getScreenshotUrl = (websiteUrl: string): string => {
    const encodedUrl = encodeURIComponent(websiteUrl);
    // Using URLBox direct API endpoint
    return `https://api.urlbox.io/v1/ubx_zNrA3L7l3L0uPom6/png?url=${encodedUrl}&width=1280&height=800`;
  };

  const loadScreenshot = (websiteUrl: string) => {
    setError('');
    setIsLoading(true);
    
    // Get screenshot URL with timestamp to force refresh
    const newScreenshotUrl = getScreenshotUrl(websiteUrl) + '&t=' + Date.now();
    setScreenshotUrl(newScreenshotUrl);
    
    if (data.onUrlChange) {
      data.onUrlChange(id, websiteUrl);
    }
  };

  const handleUrlSubmit = () => {
    const formattedUrl = formatUrl(inputUrl);
    if (formattedUrl) {
      setUrl(formattedUrl);
      loadScreenshot(formattedUrl);
    }
  };

  const handleOpenInNewTab = () => {
    if (url) {
      // Show instructional popup first
      showInstructionalPopup(() => {
        // Clean up any existing listener first
        if (visibilityListenerRef.current) {
          document.removeEventListener('visibilitychange', visibilityListenerRef.current);
          visibilityListenerRef.current = null;
        }
        
        // Mark as visited and trigger celebration
        setHasVisited(true);
        celebrateCoinsWithMessage(1, "Website opening...");
        
        // Use a flag that's not dependent on React state
        let websiteOpened = false;
        
        // Track window visibility to detect return
        const handleVisibilityChange = () => {
          console.log('🔍 Visibility change detected:', {
            visibilityState: document.visibilityState,
            websiteOpened,
            nodeId: id
          });
          
          if (document.visibilityState === 'visible' && websiteOpened) {
            console.log('✅ Triggering feedback popup for node:', id);
            // User returned - show feedback popup
            if (data.onShowFeedbackPopup) {
              data.onShowFeedbackPopup(id, url);
            }
            // Clean up listener
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            visibilityListenerRef.current = null;
          }
        };
        
        // Store reference and add listener
        visibilityListenerRef.current = handleVisibilityChange;
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Open website after delay
        setTimeout(() => {
          websiteOpened = true; // Set flag immediately before opening
          console.log('🚀 Opening website:', url);
          window.open(url, '_blank', 'noopener,noreferrer');
        }, 1000);
      });
    }
  };

  const handleTakeNotes = () => {
    if (url && data.onShowFeedbackPopup) {
      data.onShowFeedbackPopup(id, url);
    }
  };

  const handleReadCritique = async () => {
    if (url && screenshotUrl && data.onGenerateCritique) {
      celebrateCoins(1);
      console.log("Generating critique for website:", url);
      console.log("node id:", id);
      data.onGenerateCritique(id, url, screenshotUrl);
    }
  };

  const handleRefresh = () => {
    if (url) {
      setIsLoading(true);
      // Force refresh by adding timestamp
      const newScreenshotUrl = getScreenshotUrl(url) + '&t=' + Date.now();
      setScreenshotUrl(newScreenshotUrl);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError('');
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Unable to load website preview. The screenshot service may be unavailable or the website may be blocking access.');
  };

  // Auto-load screenshot when URL is provided via data prop
  useEffect(() => {
    if (data.url && data.url !== url) {
      const formattedUrl = formatUrl(data.url);
      setUrl(formattedUrl);
      setInputUrl(data.url);
      loadScreenshot(formattedUrl);
    }
  }, [data.url]);

  // Auto-load screenshot on initial mount if URL is provided
  useEffect(() => {
    if (data.url && !screenshotUrl) {
      const formattedUrl = formatUrl(data.url);
      setUrl(formattedUrl);
      setInputUrl(data.url);
      loadScreenshot(formattedUrl);
    }
  }, []);

  // Cleanup visibility listener on unmount
  useEffect(() => {
    return () => {
      if (visibilityListenerRef.current) {
        document.removeEventListener('visibilitychange', visibilityListenerRef.current);
        visibilityListenerRef.current = null;
      }
    };
  }, []);

  return (
    <div 
        className="website-preview-node flex flex-col px-4 py-4 text-white bg-yellow-600 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg border-t-8 border-t-yellow-700 transition-all duration-300 ease-in-out"
        style={{
          width: '100%',
          height: '100%',
          minWidth: '400px',
          minHeight: '500px'
        }}
      >
      
      <div className="font-semibold text-yellow-900 text-xl mb-3">
        Design Inspiration
        {/* {data.originalQuery && data.originalQuery !== data.url && (
          <div className="text-yellow-700 text-sm font-normal mt-1">
            Found via search: &quot;{data.originalQuery}&quot;
          </div>
        )} */}
      </div>
      

      <div className="flex flex-col mb-4 w-full">
        <div className="flex items-center gap-2 mb-2">
          <LuLink className="text-yellow-700" />
          <input
            type="text"
            placeholder="Enter website URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="flex-1 px-3 py-2 text-sm rounded-md bg-white bg-opacity-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={handleUrlSubmit}
            className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors font-semibold"
          >
            Load
          </button>
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <CircleAlert size={16} />
            {error}
          </div>
        )}
      </div>

      {url && (
        <>
          <div className="relative bg-white rounded-lg overflow-hidden shadow-inner flex-1 w-full group" style={{ minHeight: '400px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-gray-600 flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <div>Loading preview...</div>
                </div>
              </div>
            )}
            
            {screenshotUrl && (
              <>
                <img
                  src={screenshotUrl}
                  alt={`Preview of ${url}`}
                  className="w-full h-full object-cover object-top cursor-pointer transition-opacity"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={handleOpenInNewTab}
                  title={`Click to open ${url}`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center cursor-pointer" onClick={handleOpenInNewTab}>
                  <div className="text-white text-3xl font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center flex items-center gap-2">
                      <LuExternalLink className="mr-2" size={36} /> Inspect Design (+1💎)
                  </div>
                </div>
              </>
            )}
            
            {!screenshotUrl && !isLoading && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <LuImage size={48} className="mb-2" />
                <div className="text-center">Click &quot;Load&quot; to preview the website</div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {/* <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors font-semibold"
            >
              <LuRefreshCw size={16} />
              Refresh
            </button> */}
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 px-4 py-4 text-lg bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors font-semibold"
            >
              <LuExternalLink size={24} />
              Inspect Design <span className="text-lg font-mono">(+💎)</span>
            </button>
            <button
              onClick={handleTakeNotes}
              className="flex items-center gap-2 px-4 py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-semibold"
            >
              <LuPenTool size={24} />
              Take Notes <span className="text-lg font-mono">(+💎💎)</span>
            </button>
            <button
              onClick={handleReadCritique}
              className="flex items-center gap-2 px-4 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-semibold"
            >
              <LuEye size={24} />
              Read Critique <span className="text-lg font-mono">(+💎)</span>
            </button>
          </div>
        </>
      )}

      {/* Minimal handle for connections */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#fbbf24',
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      
      {url && (
        <NodeResizeControl
          style={{
            background: 'transparent',
            border: 'none',
            opacity: 0,
            width: '60px',
            height: '60px'
          }}
          minWidth={400}
          minHeight={500}
        />
      )}
      
    </div>
  );
});

export default WebsitePreviewNode;