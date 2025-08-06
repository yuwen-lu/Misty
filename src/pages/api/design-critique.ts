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
    const { websiteUrl, screenshotBase64 } = req.body;

    if (!websiteUrl || !screenshotBase64) {
      return res.status(400).json({ error: 'Website URL and screenshot image are required' });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // System prompt for design critique
    const systemPrompt = `You are an expert design critic with deep knowledge of user experience, visual design, and web design principles. Your task is to provide a thoughtful, constructive critique of the website design shown in the screenshot.

## Your Approach:
- Analyze the design from multiple perspectives: visual hierarchy, typography, color usage, layout, user experience, and accessibility
- Consider the website's likely purpose and target audience based on the URL and visual content
- Provide specific, actionable insights rather than generic feedback
- Balance positive observations with areas for improvement
- Ground your critique in established design principles
- Be encouraging while being honest about design issues

## Structure your critique in 3-4 concise sentences:


1. **Visual Design Analysis**: Comment on typography choices, color palette, visual hierarchy, spacing, and overall aesthetic. What design patterns or principles are being applied?

2. **User Experience Observations**: How easy would this be to navigate? Are key actions clear? How well does the design serve its users?

Keep your entire response under 50 words. Be specific, constructive, and educational.`;

    // Create the message content with the screenshot
    const messageContent = [
      {
        type: 'text',
        text: `Please provide a design critique for this website: ${websiteUrl}

Please analyze the screenshot and provide specific, constructive feedback about the design, user experience, and overall effectiveness. Consider the context and purpose of this website in your analysis.`
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: screenshotBase64.replace(/^data:image\/[^;]+;base64,/, '')
        }
      }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const critique = data.content?.[0]?.text || 'Unable to generate critique';

    res.status(200).json({ critique });

  } catch (error) {
    console.error('Error in design critique endpoint:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      critique: 'Sorry, I encountered an error while analyzing this design. Please try again.'
    });
  }
}