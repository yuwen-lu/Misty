import * as prettier from 'prettier/standalone';
import * as parserBabel from 'prettier/plugins/babel';
import * as prettierPluginEstree from "prettier/plugins/estree";
import { CategorizedChange, Change } from './prompts';

export const formatContent = (text: string) => {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph + "\n\n"}</p>`)
    .join('')
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface coordinatePositionType {
  x: number,
  y: number,
}

export const defaultBoundingBox: BoundingBox = { x: 1500, y: 100, width: 200, height: 600 };

// Check if two bounding boxes overlap
export function doBoxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
}

// Merge two bounding boxes into one
export function mergeBoundingBoxes(box1: BoundingBox, box2: BoundingBox): BoundingBox {
  const minX = Math.min(box1.x, box2.x);
  const minY = Math.min(box1.y, box2.y);
  const maxX = Math.max(box1.x + box1.width, box2.x + box2.width);
  const maxY = Math.max(box1.y + box1.height, box2.y + box2.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Merge overlapping bounding boxes in a list
// export function mergeOverlappingBoundingBoxes(boxes: BoundingBox[]): BoundingBox[] {
//   let mergedBoxes: BoundingBox[] = [];

//   for (let i = 0; i < boxes.length; i++) {
//     let merged = false;
//     for (let j = 0; j < mergedBoxes.length; j++) {
//       if (doBoxesOverlap(boxes[i], mergedBoxes[j])) {
//         mergedBoxes[j] = mergeBoundingBoxes(boxes[i], mergedBoxes[j]);
//         merged = true;
//         break;
//       }
//     }
//     if (!merged) {
//       mergedBoxes.push(boxes[i]);
//     }
//   }

//   console.log("Result of box merge: " + mergedBoxes.map((box) => { return "width: " + box.width.toString() + ", height: " + box.height.toString() }))
//   return mergedBoxes;
// }
// Crop a base64 encoded image based on a bounding box and return the cropped image as a base64 string
export async function cropImage(base64Image: string, bbox: BoundingBox): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous'; // Handle CORS issues
    image.src = base64Image;

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = bbox.width;
        canvas.height = bbox.height;
        const ctx = canvas.getContext("2d", { 
          alpha: true,
          willReadFrequently: true // Optimize for frequent reads
        });

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          image,
          bbox.x,
          bbox.y,
          bbox.width,
          bbox.height,
          0,
          0,
          bbox.width,
          bbox.height
        );

        resolve(canvas.toDataURL('image/png', 1.0)); // Max quality
      } catch (error) {
        reject(new Error(`Failed to crop image: ${error}`));
      }
    };

    image.onerror = (error) => {
      reject(new Error(`Failed to load image: ${error}`));
    };
  });
}

export const scribbleStrokeWidth = 10;

export const draw = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, paths: { x: number, y: number }[][]) => {
  // Save context state
  context.save();
  
  // Clear with proper handling
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set drawing properties
  context.strokeStyle = 'rgba(177, 230, 103, 0.5)';
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.lineWidth = scribbleStrokeWidth;
  
  // Enable anti-aliasing
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  console.log("Re-drawing, current path count: " + paths.length);

  paths.forEach((path) => {
    if (path.length < 2) return;
    
    context.beginPath();
    context.moveTo(path[0].x, path[0].y);

    // Use smoother curve interpolation
    for (let i = 1; i < path.length - 1; i++) {
      const midPoint = {
        x: (path[i].x + path[i + 1].x) / 2,
        y: (path[i].y + path[i + 1].y) / 2,
      };
      context.quadraticCurveTo(path[i].x, path[i].y, midPoint.x, midPoint.y);
    }

    // Draw the last segment
    if (path.length > 1) {
      context.lineTo(path[path.length - 1].x, path[path.length - 1].y);
    }
    
    context.stroke();
  });
  
  // Restore context state
  context.restore();
};

// used in api responses
export function removeEscapedChars(apiResponse: string): string {
  // console.log("handling escape characters: " + apiResponse);
  // Regular expression to match escaped characters
  const escapedCharsRegex = /\\./g;
  // Replace all matches with an empty string
  return apiResponse.replace(escapedCharsRegex, '');
}
// Function to strip all whitespace and normalize quotes
export const stripWhitespaceAndNormalizeQuotes = (str: string): string => {
  return str.replace(/\s+/g, '').replace(/"/g, "'");
};

// Function to escape regex special characters
export const escapeRegex = (str: string): string => {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const formatCode = async (code: string): Promise<string> => {
  console.log("🔧 formatCode called - enhanced version with syntax fixing!");
  
  try {
    // Format the code using Prettier
    const formattedCode = await prettier.format(code, {
      parser: "babel",
      tabWidth: 4,
      plugins: [parserBabel as any, prettierPluginEstree as any],
    });
    console.log("formattedCode: " + formattedCode);
    return formattedCode.replace(/{" "}/g, "");
  } catch (error) {
    console.warn("Failed to format code with Prettier:", error);
    
    // Try to fix common syntax errors before giving up
    let fixedCode = code;
    
    try {
      // Fix unterminated strings in className attributes
      fixedCode = fixUnterminatedStrings(fixedCode);
      
      // Try formatting again with the fixed code
      const formattedCode = await prettier.format(fixedCode, {
        parser: "babel",
        tabWidth: 4,
        plugins: [parserBabel as any, prettierPluginEstree as any],
      });
      console.log("Successfully formatted after fixing syntax errors");
      return formattedCode.replace(/{" "}/g, "");
      
    } catch (secondError) {
      console.warn("Failed to format even after attempting to fix syntax errors:", secondError);
      return fixedCode; // Return the fixed code even if formatting still fails
    }
  }
};

// Helper function to fix common unterminated string issues
function fixUnterminatedStrings(code: string): string {
  let fixedCode = code;
  
  // Fix unterminated className attributes specifically
  // Pattern: className=" followed by content but missing closing quote
  const classNamePattern = /className=["']([^"']*?)(?=\s|>|$)/g;
  fixedCode = fixedCode.replace(classNamePattern, (match, content) => {
    // If the match doesn't end with a quote, add one
    if (!match.endsWith('"') && !match.endsWith("'")) {
      const quote = match.includes('"') ? '"' : "'";
      return `className=${quote}${content}${quote}`;
    }
    return match;
  });
  
  // Fix other common attribute string issues
  const attributePattern = /(\w+)=["']([^"']*?)(?=\s|>|$)/g;
  fixedCode = fixedCode.replace(attributePattern, (match, attrName, content) => {
    if (!match.endsWith('"') && !match.endsWith("'")) {
      const quote = match.includes('"') ? '"' : "'";
      return `${attrName}=${quote}${content}${quote}`;
    }
    return match;
  });
  
  // Fix unterminated JSX self-closing tags
  fixedCode = fixedCode.replace(/(<\w+[^>]*[^\/])(\s*>)/g, '$1 />');
  
  console.log("Applied syntax fixes to code");
  return fixedCode;
}

/**
 * Converts a base64-encoded image into an outline image and returns the processed base64 string.
 * @param base64Image - The base64-encoded image string.
 * @returns A promise that resolves with the base64-encoded outline image string.
 */
export async function convertToOutline(base64Image: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get 2D context'));
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get the image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and detect edges
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }

      ctx.putImageData(imageData, 0, 0);

      const edgeData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const threshold = 128;
      const outlineData = new Uint8ClampedArray(edgeData.length);

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const gx =
            (-1 * data[idx - 4 - canvas.width * 4]) +
            (1 * data[idx + 4 - canvas.width * 4]) +
            (-2 * data[idx - 4]) +
            (2 * data[idx + 4]) +
            (-1 * data[idx - 4 + canvas.width * 4]) +
            (1 * data[idx + 4 + canvas.width * 4]);

          const gy =
            (-1 * data[idx - 4 - canvas.width * 4]) +
            (-2 * data[idx - canvas.width * 4]) +
            (-1 * data[idx + 4 - canvas.width * 4]) +
            (1 * data[idx - 4 + canvas.width * 4]) +
            (2 * data[idx + canvas.width * 4]) +
            (1 * data[idx + 4 + canvas.width * 4]);

          const g = Math.sqrt(gx * gx + gy * gy);
          const value = g > threshold ? 255 : 0;
          outlineData[idx] = outlineData[idx + 1] = outlineData[idx + 2] = value;
          outlineData[idx + 3] = 255; // alpha
        }
      }

      ctx.putImageData(new ImageData(outlineData, canvas.width, canvas.height), 0, 0);

      const outlineBase64 = canvas.toDataURL();
      resolve(outlineBase64);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}

export async function blurImage(base64Image: string, blurAmount: number = 4): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get 2D context'));
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Apply blur effect
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(canvas, 0, 0);

      const blurredBase64 = canvas.toDataURL();
      resolve(blurredBase64);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}


export interface loadingIdState {
  id: string,
  loading: boolean,
}

export interface codeRenderNodeContent {
  code: string,
  prevCode: string,
  blendedCode?: string,
  nodeId: string | null,
  categorizedChanges: CategorizedChange[], // the changes that render dynamic UI
  sourceNodeId: string,
  textPrompt: string,
  base64Image: string
}


export const tempChanges: Change[] = [{
  "type": "color",
  "before": "bg-black",
  "after": "bg-white"
}, {
  "type": "color",
  "before": "text-white",
  "after": "text-gray-900"
}, {
  "type": "color",
  "before": "bg-gray-800",
  "after": "bg-white"
}, {
  "type": "shadow",
  "before": "",
  "after": "shadow-md"
}, {
  "type": "border",
  "before": "border-gray-500/90",
  "after": "border-gray-200"
}, {
  "type": "text-size",
  "before": "w-72",
  "after": "w-40"
}, {
  "type": "font-style",
  "before": "",
  "after": "text-base font-medium"
}]


export const findAllIndexesOfStrings = (mainString: string, ...searchStrings: string[]): number[] => {
  const indexes: number[] = [];

  searchStrings.forEach(searchString => {
    if (!searchString) return;
    let position: number = mainString.indexOf(searchString);
    // console.log("looking for string " + searchString + " in string " + mainString.slice(0, 100));
    while (position !== -1) {
      // console.log("Finding position: " + position);
      indexes.push(position);
      position = mainString.indexOf(searchString, position + searchString.length);
    }
  });

  // Sort the indexes in ascending order
  indexes.sort((a, b) => a - b);
  return indexes;
};

export const getIndexesToChange = (prevCode: string, newCode: string, oldValue: string, newValue: string): number[] => {

  const newCodeNewValueIdx = findAllIndexesOfStrings(newCode, newValue);
  if (!oldValue) return newCodeNewValueIdx; // this is a newly added value, just use this

  const prevCodeIdx = findAllIndexesOfStrings(prevCode, oldValue, newValue);
  const prevCodeOldValueIdx = findAllIndexesOfStrings(prevCode, oldValue);

  const newCodeIdx = findAllIndexesOfStrings(newCode, oldValue, newValue);

  const changeIdx: number[] = newCodeIdx.filter((value, pos) => {
    // we only get the idx of oldValue -> newValue
    return newCodeNewValueIdx.includes(value) && prevCodeOldValueIdx.includes(prevCodeIdx[pos]);
  });

  return changeIdx;
};

export const splitChanges = (changes: string): string[] => {

  // if it's a whole tag that's added, just return the whole thing
  if (changes.includes("<") || changes.includes("/>")) {
    return [changes];
  }
  // sometimes there are weird responses like size: 40, we need to change them to size-40
  const splittedChanges = changes.replaceAll(": ", "-").split(" ");
  return splittedChanges;
}