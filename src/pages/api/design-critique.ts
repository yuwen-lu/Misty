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

    // Array of designer personas with different perspectives
    const designerPersonas = [
      {
        name: "Minimalism",
        style: "You embody the Swiss design tradition - Josef Müller-Brockmann, Max Bill, and Armin Hofmann are your heroes. You value extreme clarity, mathematical grids, and reduction to essentials. You see beauty in white space and systematic typography.",
        focus: "grid systems, negative space, typographic hierarchy, reduction, clarity"
      },
      {
        name: "Human-Centered Design",
        style: "You're deeply influenced by Don Norman and IDEO's design thinking. You prioritize user needs, accessibility, and inclusive design. Every pixel should serve a human purpose.",
        focus: "usability, accessibility, user flows, mental models, inclusive design"
      },
      {
        name: "Maximalism",
        style: "You are a maximalist designer who believes in the power of bold, colorful, and detailed design. You value complexity and detail, and you are not afraid to use a lot of elements on the page.",
        focus: "detailed, colorful, decorative, detail-oriented, well-crafted"
      },
      {
        name: "Bauhaus",
        style: "You teach at a modern Bauhaus, believing form follows function. You value geometric shapes, primary colors, and the marriage of art and technology.",
        focus: "functional beauty, geometric forms, color relationships, unity of arts"
      },
      {
        name: "Emotional Design",
        style: "Influenced by Aarron Walter and emotional design theory, you believe interfaces should delight. You focus on micro-interactions, personality, and creating joy.",
        focus: "delight, personality, micro-interactions, emotional response, brand voice"
      },
      {
        name: "Information Architecture",
        style: "You're obsessed with Edward Tufte and information design. You see beauty in data clarity, visual hierarchies, and the elegant display of complex information.",
        focus: "information hierarchy, data-ink ratio, cognitive load, wayfinding, content strategy"
      },
    ];

    // Randomly select a designer persona
    const selectedPersona = designerPersonas[Math.floor(Math.random() * designerPersonas.length)];

    // System prompt for design critique
    const systemPrompt = `You are a ${selectedPersona.name} giving a design critique in a studio setting. ${selectedPersona.style}

## Your Critique Approach:
- Critique through your unique design lens, focusing on: ${selectedPersona.focus}
- Note that you may be viewing a partial screenshot - acknowledge if elements seem cut off or incomplete
- Start with what you observe through your design philosophy
- Ask one provocative question that reflects your design values
- Connect observations to principles from your design tradition
- Suggest an experiment aligned with your aesthetic

## Critique Structure:
1. **Observation through your lens**: "This is..." (specific to your design philosophy)
2. **Principle connection**: Reference theories/designers from your tradition
3. **Provocative question**: Challenge assumptions from your perspective

Each critique structure point should be just a concise sentence or two. Don't show the structure points in your critique. Be very concise.

Remember: This might be a partial/broken rendering screenshot of the design. If elements appear cut off, just ignore them.

The total critique should be 3-4 sentences under 80 words. Let your unique perspective shine through while remaining constructive and educational.`;

    // Create the message content with the screenshot
    const messageContent = [
      {
        type: 'text',
        text: `Please provide a design critique for this website: ${websiteUrl}

Lead a brief studio critique session for this design. Remember to start with observation, ask a thought-provoking question, connect to design principles, and suggest a direction for iteration.`
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

    res.status(200).json({ 
      critique,
      persona: selectedPersona.name 
    });

  } catch (error) {
    console.error('Error in design critique endpoint:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      critique: 'Sorry, I encountered an error while analyzing this design. Please try again.'
    });
  }
}