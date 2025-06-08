import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set desired value here
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('Received chat request');
    const data = req.body;
    console.log(`Request data: ${JSON.stringify(data)}`);
    
    if (!data) {
      console.error('No JSON data received');
      return res.status(400).json({ error: 'No JSON data received' });
    }

    const { message, image, json_mode } = data;

    if (!message) {
      console.error('No message provided');
      return res.status(400).json({ error: 'No message provided' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const MODEL = 'gpt-4o';
    console.log(`Processing message: ${message}`);
    
    // Strip the prefix of the base64 image
    let processedImage = image;
    if (image) {
      processedImage = image.split('base64,').pop();
      console.log('Image data received');
    }

    // Get the current timestamp in Pacific Time
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/[\/,:]/g, '').replace(/ /g, '_');

    // Set up streaming response headers - disable buffering
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    try {
      // Accumulate output chunks
      const outputChunks: string[] = [];

      // System prompt
      const systemPrompt = {
        role: 'system' as const,
        content: "You are a senior professional UI/UX designer and developer. Your main job is to follow the user's instructions, help them create UI frontend code that matches their requirements. Use React and TailwindCSS in your implementation. Generate all of the that should be there, generate full code, DO NOT omit anything. DO NOT use template information, use actual content. Do not provide information you are not asked about."
      };

      // Construct the message body based on whether there are images sent
      const userMessageBody: any[] = [systemPrompt];

      // Then append the text prompt
      let userMessage: any;
      if (processedImage) {
        userMessage = {
          role: 'user',
          content: [
            { type: 'text', text: message },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${processedImage}` }
            }
          ]
        };
      } else {
        userMessage = { role: 'user', content: message };
      }

      userMessageBody.push(userMessage);

      console.log('Initializing OpenAI client');
      const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      console.log('Starting OpenAI stream');
      const stream = await client.chat.completions.create({
        model: MODEL,
        messages: userMessageBody,
        stream: true,
        response_format: json_mode ? { type: 'json_object' } : { type: 'text' },
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          const contentChunk = chunk.choices[0].delta.content;
          console.log(`Received chunk: ${contentChunk}`);
          outputChunks.push(contentChunk);
          
          // Write the chunk directly without buffering
          res.write(contentChunk);
          
          // Force immediate transmission in development
          if (process.env.NODE_ENV === 'development') {
            await new Promise(resolve => setImmediate(resolve));
          }
        }
      }

      console.log('Stream completed');
      res.end();

    } catch (error) {
      console.error(`Error in streaming: ${error}`);
      res.write(`Error: ${error}`);
      res.end();
    }

  } catch (error) {
    console.error(`Error in chat endpoint: ${error}`);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
} 