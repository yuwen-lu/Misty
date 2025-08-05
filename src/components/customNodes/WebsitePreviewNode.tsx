import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow';
import { LuExternalLink, LuRefreshCw, LuLink } from 'react-icons/lu';

const WebsitePreviewNode: React.FC<NodeProps> = React.memo(({ id, data }) => {
  const [url, setUrl] = useState<string>(data.url || '');
  const [inputUrl, setInputUrl] = useState<string>(data.url || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const formatUrl = (inputUrl: string): string => {
    if (!inputUrl) return '';
    
    if (!/^https?:\/\//i.test(inputUrl)) {
      return `https://${inputUrl}`;
    }
    
    return inputUrl;
  };

  const handleUrlSubmit = () => {
    const formattedUrl = formatUrl(inputUrl);
    if (formattedUrl) {
      setUrl(formattedUrl);
      setError('');
      setIsLoading(true);
      
      if (data.onUrlChange) {
        data.onUrlChange(id, formattedUrl);
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current && url) {
      setIsLoading(true);
      iframeRef.current.src = url;
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Unable to load website in preview. This site blocks iframe embedding due to security policies. Click "Open in New Tab" to view it directly.');
  };

  useEffect(() => {
    if (data.url && data.url !== url) {
      setUrl(data.url);
      setInputUrl(data.url);
    }
  }, [data.url]);

  return (
    <div 
      className="website-preview-node flex flex-col px-4 py-4 text-white bg-yellow-600 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg border-t-8 border-t-yellow-700 transition-all duration-300 ease-in-out"
      style={{
        width: '100%',
        height: '100%',
        minWidth: '1200px',
        minHeight: '900px'
      }}
    >
      
      <div className="font-semibold text-yellow-900 text-xl mb-3">
        Website Preview
        {data.originalQuery && data.originalQuery !== data.url && (
          <div className="text-yellow-700 text-sm font-normal mt-1">
            Found via search: &quot;{data.originalQuery}&quot;
          </div>
        )}
      </div>
      
      {data.annotation && (
        <div className="text-yellow-800 text-sm mb-4 px-3 py-2 bg-yellow-50 rounded-md border border-yellow-200">
          <div className="font-medium mb-1">Why this design works:</div>
          <div className="whitespace-pre-wrap">{data.annotation}</div>
        </div>
      )}

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
          <div className="text-red-500 text-sm mt-1">
            {error}
          </div>
        )}
      </div>

      {url && (
        <>
          <div className="relative bg-white rounded-lg overflow-hidden shadow-inner flex-1 w-full" style={{ minHeight: '600px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-gray-600">Loading website...</div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={url}
              title="Website Preview"
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
            
            <div 
              className="absolute inset-0 cursor-pointer z-20"
              onClick={handleOpenInNewTab}
              title="Click to open in new tab"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors font-semibold"
            >
              <LuRefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors font-semibold"
            >
              <LuExternalLink size={16} />
              Open in New Tab
            </button>
          </div>
        </>
      )}

      <Handle
        className="bg-yellow-700 opacity-50"
        style={{
          width: '20px',
          height: '60px',
          borderRadius: '5px',
          borderWidth: '2px',
          borderColor: 'white',
          borderStyle: 'solid',
          marginRight: '-5px',
        }}
        type="source"
        position={Position.Right}
        id="b"
        isConnectable={true}
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
          minHeight={300}
        />
      )}
      
    </div>
  );
});

export default WebsitePreviewNode;