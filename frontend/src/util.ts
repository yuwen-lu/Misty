export const formatContent = (text: string) => {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph + "\n\n"}</p>`)
    .join('')
}

export type BoundingBox = {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
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
  export function mergeOverlappingBoundingBoxes(boxes: BoundingBox[]): BoundingBox[] {
    let mergedBoxes: BoundingBox[] = [];
  
    for (let i = 0; i < boxes.length; i++) {
      let merged = false;
      for (let j = 0; j < mergedBoxes.length; j++) {
        if (doBoxesOverlap(boxes[i], mergedBoxes[j])) {
          mergedBoxes[j] = mergeBoundingBoxes(boxes[i], mergedBoxes[j]);
          merged = true;
          break;
        }
      }
      if (!merged) {
        mergedBoxes.push(boxes[i]);
      }
    }
  
    console.log("Result of box merge: " + mergedBoxes.map( (box) => { return "width: " + box.width.toString() + ", height: " + box.height.toString() }))
    return mergedBoxes;
  }
  
  // Crop a base64 encoded image based on a bounding box and return the cropped image as a base64 string
  export async function cropImage(base64Image: string, bbox: BoundingBox): Promise<string> {
    const image = new Image();
    image.src = base64Image;
  
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
  
    const canvas = document.createElement("canvas");
    canvas.width = bbox.width;
    canvas.height = bbox.height;
    const ctx = canvas.getContext("2d");
  
    if (!ctx) {
      throw new Error("Could not get canvas context");
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
  
    return canvas.toDataURL();
  }
  