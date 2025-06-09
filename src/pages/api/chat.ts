import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set desired value here
    },
  },
}

// Image resizing function
async function resizeBase64Image(base64Data: string, maxWidth = 1536, maxHeight = 1536, quality = 92): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64Image = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Get original image info
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}, size: ${Math.round(imageBuffer.length / 1024)}KB`);
    
    // Only resize if the image is larger than target size OR file size is over 800KB
    const fileSizeKB = Math.round(imageBuffer.length / 1024);
    const needsResizing = (metadata.width! > maxWidth || metadata.height! > maxHeight) || fileSizeKB > 800;
    
    if (!needsResizing) {
      console.log('Image already optimized, skipping resize');
      return base64Data;
    }
    
    // Resize the image with smarter compression
    let resizedBuffer: Buffer;
    
    // Use original format if it's already JPEG, otherwise convert to JPEG
    if (metadata.format === 'jpeg') {
      resizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true // Don't enlarge smaller images
        })
        .jpeg({ quality, progressive: true }) // Progressive JPEG for better loading
        .toBuffer();
    } else {
      // Convert other formats (PNG, WebP, etc.) to JPEG
      resizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    }
    
    // Get resized image info
    const resizedMetadata = await sharp(resizedBuffer).metadata();
    console.log(`Resized image: ${resizedMetadata.width}x${resizedMetadata.height}, size: ${Math.round(resizedBuffer.length / 1024)}KB`);
    console.log(`Size reduction: ${Math.round((1 - resizedBuffer.length / imageBuffer.length) * 100)}%`);
    
    // Save resized image to cached folder for inspection
    // const timestamp = Date.now();
    // const filename = `resized-${timestamp}.jpg`;
    // const cachePath = path.join(process.cwd(), 'public', 'cached-images', filename);
    
    // // Ensure the directory exists
    // const cacheDir = path.dirname(cachePath);
    // if (!fs.existsSync(cacheDir)) {
    //   fs.mkdirSync(cacheDir, { recursive: true });
    // }
    
    // // Write the resized image to file
    // fs.writeFileSync(cachePath, resizedBuffer);
    
    // // Log the URL for visual inspection
    // console.log(`\n🖼️  RESIZED IMAGE SAVED: http://localhost:3000/cached-images/${filename}`);
    // console.log('📏 To inspect: Open the above URL in your browser\n');
    
    // Convert back to base64 and return
    const resizedBase64 = resizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${resizedBase64}`;
    
  } catch (error) {
    console.error('Error resizing image:', error);
    // Return original image if resizing fails
    return base64Data;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const startTime = Date.now();
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
    
    // Process and resize the image
    let processedImage = image;
    if (image) {
      console.log('Image data received, starting resize...');
      const resizeStart = Date.now();
      
      // Resize the image for better OpenAI performance (more conservative)
      const resizedImage = await resizeBase64Image(image, 1536, 1536, 92);
      console.log(`Image resizing completed in ${Date.now() - resizeStart}ms`);
      
      // Strip the data URL prefix for OpenAI
      processedImage = resizedImage.split('base64,').pop();
    }

    // Set up streaming response headers (simple approach for better compatibility)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.status(200);

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

      const clientInitStart = Date.now();
      console.log('Initializing OpenAI client');
      const client = new OpenAI({
        apiKey: OPENAI_API_KEY,
        timeout: 50000, // 50 seconds timeout (less than Vercel's 60s limit)
      });
      console.log(`OpenAI client initialized in ${Date.now() - clientInitStart}ms`);

      const streamStart = Date.now();
      console.log('Starting OpenAI stream');
      const stream = await client.chat.completions.create({
        model: MODEL,
        messages: userMessageBody,
        stream: true,
        response_format: json_mode ? { type: 'json_object' } : { type: 'text' },
      });

      let firstChunkReceived = false;
      let lastChunkTime = Date.now();
      const CHUNK_TIMEOUT = 30000; // 30 seconds between chunks
      
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          if (!firstChunkReceived) {
            console.log(`Time to first chunk: ${Date.now() - streamStart}ms`);
            console.log(`Total time to start streaming: ${Date.now() - startTime}ms`);
            firstChunkReceived = true;
          }
          
          const contentChunk = chunk.choices[0].delta.content;
          // console.log(`Received chunk: ${contentChunk}`);
          outputChunks.push(contentChunk);
          lastChunkTime = Date.now();
          
          // Write the chunk and force flush
          res.write(contentChunk);
        }
        
        // Check for timeout between chunks
        if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
          console.warn('Stream timeout - no chunks received in 30 seconds');
          break;
        }
      }

      const totalStreamTime = Date.now() - streamStart;
      const totalChunks = outputChunks.length;
      console.log(`Stream completed in ${totalStreamTime}ms with ${totalChunks} chunks`);
      
      // Log if stream seems incomplete (no final closing brace/bracket)
      const fullResponse = outputChunks.join('');
      if (fullResponse.trim() && !fullResponse.trim().endsWith('}')) {
        console.warn('⚠️ Stream may be incomplete - response does not end with closing brace');
        console.log('Last 100 chars:', fullResponse.slice(-100));
      }
      
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