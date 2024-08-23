import * as prettier from 'prettier/standalone';
import * as parserBabel from 'prettier/parser-babel';
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
    image.src = base64Image;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = bbox.width;
      canvas.height = bbox.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

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

      resolve(canvas.toDataURL());
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
}

export const scribbleStrokeWidth = 10;

export const draw = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, paths: { x: number, y: number }[][]) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(177, 230, 103, 0.5)';
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.lineWidth = scribbleStrokeWidth;

  console.log("Re-drawing, current path count: " + paths.length);

  paths.forEach((path) => {
    if (path.length < 2) return;
    context.beginPath();
    context.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length - 1; i++) {
      const midPoint = {
        x: (path[i].x + path[i + 1].x) / 2,
        y: (path[i].y + path[i + 1].y) / 2,
      };
      context.quadraticCurveTo(path[i].x, path[i].y, midPoint.x, midPoint.y);
    }

    context.lineTo(path[path.length - 1].x, path[path.length - 1].y);
    context.stroke();
  });
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
  const formattedCode = prettier.format(code, {
    parser: "babel",
    tabWidth: 4,
    plugins: [parserBabel, prettierPluginEstree]
  });
  return formattedCode.replaceAll("{\" \"}", "");
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