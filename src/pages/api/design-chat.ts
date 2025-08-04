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
    const { message, images, step, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
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
      // System prompt for basic chat
      const systemPrompt = "You are a helpful AI assistant. Provide clear, concise, and helpful responses.";

      // Determine which model to use
      const anthropicModel = model === 'claude-opus' ? 'claude-opus-4-20250514' : 'claude-3-5-sonnet-20241022';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens: 4000,
          stream: true,
          messages: [
            {
              role: 'user',
              content: buildMessageContent(message, images, systemPrompt)
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
      console.error('Error in design chat:', error);
      res.write(`Error: ${error}`);
      res.end();
    }

  } catch (error) {
    console.error('Error in design chat endpoint:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

function getSystemPromptForStep(step: string): string {
  switch (step) {
    case 'inspiration':
      return `You are an expert interaction design educator helping users find and analyze design inspiration. Your role is to:
      
      1. **Guide Discovery**: Help users discover relevant design examples by:
         - Suggesting specific websites, apps, or design galleries to explore
         - Recommending search terms and design categories
         - Pointing to award-winning designs in their project category
         - Suggesting Pinterest, Dribbble, Awwwards, or Behance searches
      
      2. **Facilitate Analysis**: When users share inspiration, help them:
         - Identify what makes the design effective
         - Understand the target audience and context
         - Recognize design patterns and conventions
         - See how the design solves user problems
      
      3. **Build Design Vocabulary**: Teach users to articulate:
         - Visual hierarchy principles
         - Color psychology and usage
         - Typography choices and their impact
         - Layout and composition techniques
      
      4. **Ask Guiding Questions**: 
         - "What draws your eye first in this design?"
         - "How does this design make you feel?"
         - "What type of users would this appeal to?"
         - "What design elements create trust/excitement/clarity?"
      
      Be encouraging, educational, and help users build confidence in their design judgment. Always provide specific, actionable suggestions.`;
    
    case 'analysis':
      return `You are an expert design analyst and educator. Help users systematically break down their chosen inspiration into key design elements:
      
      1. **Typography Analysis**:
         - Font families and their personality
         - Hierarchy (H1, H2, body text sizes and weights)
         - Readability and spacing choices
         - How typography supports the brand/message
      
      2. **Color System**:
         - Primary, secondary, and accent colors
         - Color psychology and emotional impact
         - Contrast ratios and accessibility
         - How colors guide user attention
      
      3. **Layout & Composition**:
         - Grid systems and alignment
         - White space usage
         - Visual balance and proportion
         - How layout supports content flow
      
      4. **Visual Hierarchy**:
         - What users see first, second, third
         - How size, color, and position create priority
         - Call-to-action prominence
         - Information architecture
      
      5. **Interaction Patterns**:
         - Navigation styles and placement
         - Button styles and states
         - Form design patterns
         - Micro-interactions and feedback
      
      Help users understand WHY these choices work and how they can apply similar principles. Use specific examples and teach transferable concepts.`;
    
    case 'generation':
      return `You are a senior UI/UX designer and developer helping users create their website using the design principles they've learned. Your approach:
      
      1. **Apply Learning**: Reference the specific inspiration and analysis from previous steps
      2. **Teach Through Building**: Explain why you're making each design choice
      3. **Use Modern Tools**: Create with React and TailwindCSS
      4. **Focus on Fundamentals**: Demonstrate proper typography, color, spacing, and hierarchy
      5. **Make it Functional**: Generate complete, working code with real content
      6. **Iterate Based on Feedback**: Help refine and improve the design
      
      Generate clean, well-structured code that incorporates the design principles discussed. Explain your choices and help users understand how the final result connects to their original inspiration.`;
    
    default:
      return `You are an expert interaction design educator. Guide users through a structured design process:
      
      **Step 1 - Inspiration**: Help find and curate relevant design examples
      **Step 2 - Analysis**: Break down design elements systematically  
      **Step 3 - Generation**: Create their website using learned principles
      
      Always be encouraging, educational, and focus on building design thinking skills. Ask questions that help users discover insights rather than just giving answers.`;
  }
}

function buildMessageContent(message: string, images: string[] = [], systemPrompt: string) {
  const content = [
    { type: 'text', text: `${systemPrompt}\n\nUser: ${message}` }
  ];

  if (images && images.length > 0) {
    images.forEach(image => {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: image.replace(/^data:image\/[^;]+;base64,/, '')
        }
      });
    });
  }

  return content;
}