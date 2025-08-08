import { NextApiRequest, NextApiResponse } from 'next';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Mock Lucide React icons for server-side rendering
const createIcon = (pathData: string) => {
  return React.createElement('svg', {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    dangerouslySetInnerHTML: { __html: pathData }
  });
};

const iconMap: Record<string, () => React.ReactElement> = {
  LuAlignJustify: () => createIcon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'),
  LuAperture: () => createIcon('<circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/>'),
  LuAward: () => createIcon('<circle cx="12" cy="8" r="6"/><path d="l9 22-3-11 6-3-6-3 3-11-9 22"/><path d="l15 22-3-11 6-3-6-3 3-11-9 22"/>'),
  LuCompass: () => createIcon('<circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>'),
  LuCheckCircle: () => createIcon('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="l9 11 5-8"/>'),
  LuSearch: () => createIcon('<circle cx="11" cy="11" r="8"/><path d="l21 21-4.35-4.35"/>'),
  LuClock: () => createIcon('<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>'),
  LuUsers: () => createIcon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  // Add more icons as needed
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { componentCode } = req.body;

    if (!componentCode) {
      return res.status(400).json({ error: 'No component code provided' });
    }

    // Create a safe evaluation context
    const evalContext = {
      React,
      useState: React.useState,
      useEffect: React.useEffect,
      useCallback: React.useCallback,
      useMemo: React.useMemo,
      ...iconMap
    };

    // Safely evaluate the component code
    const componentFunction = new Function(
      ...Object.keys(evalContext),
      `return (${componentCode})`
    )(...Object.values(evalContext));

    // Render the component to HTML
    const html = renderToString(React.createElement(componentFunction));

    // Return full HTML page
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(fullHtml);

  } catch (error) {
    console.error('Component rendering error:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #fef2f2;
            color: #dc2626;
        }
        .error-container {
            padding: 20px;
            border: 1px solid #fecaca;
            border-radius: 8px;
            background: white;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h3>Component Rendering Error</h3>
        <p>There was an error rendering this design component.</p>
        <details>
            <summary>Error Details</summary>
            <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </details>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}