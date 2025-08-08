import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { designContext } = req.body;

    if (!designContext) {
      return res.status(400).json({ error: 'No design context provided' });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Set up streaming response headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);

    try {
      const systemPrompt = `You are an expert web designer and React developer who creates beautiful, modern, website designs. 
      
      DO NOT USE GRADIENTS AND EMOJIS IN YOUR DESIGNS.

## Your Role
- Generate complete, functional React components with Tailwind CSS
- Create designs that are visually appealing and user-friendly
- Use modern design principles: proper typography, spacing, color schemes, and layout
- Ensure accessibility and usability in all designs

## Technical Requirements
- Use only React (functional components with hooks) and Tailwind CSS classes
- Create responsive layouts optimized for DESKTOP viewing (1280px+ width)
- Design for desktop-first, not mobile-first
- Use semantic HTML structure
- Return only the component function: () => { }
- Do not include imports, exports, or additional code
- Use proper Tailwind classes for styling
- Assume the component will be rendered in a 1280px wide container

## Design Guidelines
- Use appropriate color schemes that match the brand/industry
- Implement proper typography hierarchy
- Include intuitive navigation and clear call-to-action elements
- Ensure good contrast and readability
- Use whitespace effectively for clean, uncluttered layouts

## Available Resources
- Stock photos: /stock/landscape0.jpg to landscape9.jpg, /stock/portrait0.jpg to portrait7.jpg
- Nature photos: /stock/nature_landscape0.jpg to nature_landscape4.jpg, /stock/nature_portrait0.jpg to nature_portrait3.jpg
- Lucide React icons (imported as LuIconName): LuActivity, LuAirplay, LuAlertCircle, LuAlignCenter, LuAlignJustify, LuAlignLeft, LuAlignRight, LuAnchor, LuAperture, LuArchive, LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuAtSign, LuAward, LuBarChart, LuBattery, LuBell, LuBluetooth, LuBook, LuBookmark, LuBox, LuBriefcase, LuCalendar, LuCamera, LuCheck, LuCheckCircle, LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp, LuClipboard, LuClock, LuCloud, LuCode, LuCompass, LuCopy, LuCreditCard, LuCrop

## Output Format
Return ONLY the React component function code - no JSON wrapper, no explanations, just the raw code:

() => { /* Complete React component code here */ }

CRITICAL: Do not include any text before or after the code. Return only the function code.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          stream: true,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\nDesign Context: ${designContext}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                res.write(data.delta.text);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      res.end();

    } catch (error) {
      console.error('Error in design generation:', error);
      res.write(`Error: ${error}`);
      res.end();
    }

  } catch (error) {
    console.error('Error in design generation endpoint:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}