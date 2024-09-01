export type Change = {
    type: string;
    before: string;
    after: string;
};

export type CategorizedChange = {
    category: string;
    changes: Change[]
};

export interface ParsedGlobalBlendingData {
    updatedCode: string;
    categorizedChanges: CategorizedChange[];
}

export function parseResponse(response: string): ParsedGlobalBlendingData {
    return JSON.parse(response) as ParsedGlobalBlendingData;
};

const getPromptForBlendMode = (blendModes: string[]): string => {
    if (blendModes.length === 0) {
        return "Please provide at least one blend mode.";
    }

    const blendModeDescriptions: { [key: string]: string } = {
        "Color": "blend the prominent color of the reference image into",
        "Layout": "blend the layout of the reference image into",
        "Addition": "add the content of the reference image to"
    };

    let promptText = "Help me ";

    if (blendModes.length === 1) {
        promptText += blendModeDescriptions[blendModes[0]];
    } else {
        promptText += blendModes.map(mode => blendModeDescriptions[mode]).join(" and ");
    }

    return promptText;
};

export const constructTextPrompt = (renderCode: string) => {

    return `Here is my react and tailwind code: 
                
        ${renderCode}. 

        Help me create a new component page that blends the content of the above code with the visual style, layout, and appearance of the reference image. Change only the source code corresponding to this, and no other sections.

        Preserve the content in the UI of the code, follow the layout and visual style of the reference image, optionally add more content where the original code's content cannot fill in all fields in the reference image's layout. Do not use content from the reference image, just use its layout and visual style. 

        A few rules:

        - First, explain in concise language the design of the reference screenshot. Use it as a basis of your generation.
        - Make sure all text is legible on the background.
        - Briefly summarize the differences between the reference image and the code, summarize them into a few categories of changes you want to make. Base your later generation of categorizedChanges based on these categories.
        - only use tailwind, react, and react icons. Follow the current code structure, do not include any import or export statements, just use a simple component definition () => {};
        - when adding icons, pick from this list of lucide react icons, do not use others: LuActivity, LuAirplay, LuAlertCircle, LuAlignCenter, LuAlignJustify, LuAlignLeft, LuAlignRight, LuAnchor, LuAperture, LuArchive, LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuAtSign, LuAward, LuBarChart, LuBattery, LuBell, LuBluetooth, LuBook, LuBookmark, LuBox, LuBriefcase, LuCalendar, LuCamera, LuCheck, LuCheckCircle, LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp, LuClipboard, LuClock, LuCloud, LuCode, LuCompass, LuCopy, LuCreditCard, LuCrop
        - there are a few stock photos for use under the folder /stock/, they are named after their orientation, like landscape0.jpg, landscape1.jpg, portrait0.jpg, etc. There are landscape images with index 0 to 9, and portrait 0 to 7. For example, you can use         <img src="/stock/portait0.jpg" alt="Example Image" />. There are also nature-themed pictures, named from nature_landscape0.jpg to nature_landscape4.jpg, and nature_portrait0.jpg to nature_portrait3.jpg.  Do not use any other images. Do not use placeholder image paths.
        - Summarize the code changes in your response, use the format "categorizedChanges:" followed by a list of changes. Be very concise in your explanations. For example, "Color change: section titles, from green to purple"; "Layout change: adapted the layout for [add the feature description of the changed code piece]".

        Return result in the below format, make sure you use json:

        {
            "designExplanation": // explain the design of the screenshot image, focus on layout and color, be really concise, less than 30 words
            "differences": // briefly summarize the differences between the reference image and the code, focus on layout orientation, spacing, color theme, font, etc.
            updatedCode: \`() => {}\`   // return the whole component for the entire screen, with the updates;
            // a list of objects listing the changes made, use the tailwind classes to indicate the changes
            categorizedChanges: [
                {
                    category: "",   // summarize the category of the below changes, group changes together semantically, e.g. "Color: Changed light to dark theme", "Layout: Increased spacing between elements", "Visual details: Increased corner roundedness", "Image: Decreased image size", "Font: Changed font appearance", etc.
                    changes: [{
                        type: "color",
                        before": // the tailwind class before the change,
                        "after": // the tailwind class after the change
                    }]
                }
            ]
        }

        here is a good example of the changes field:
        categorizedChanges: [
            {
                category: "Color: Changed light to dark theme",
                changes: [{
                    type: "color",
                    before: "bg-black",
                    after: "bg-white"
                }, {
                    type: "color",
                    before: "text-white",
                    after: "text-gray-900"
                }, {
                    type: "border",
                    before: "", // you can use empty before field to indicate addition of new classes
                    after: "border-2 border-gray-300/90"
                }, ...] // add as many as appropriate,
            },
            {
                category: "Font: Changed font appearance",
                changes: [{
                    type: "color",
                    before: "bg-black",
                    after: "bg-white"
                }, {
                    type: "font",
                    before: "text-sm",
                    after: "text-lg"
                }, ...] // add as many as appropriate,
            },
            
            ]
            `;
};



export const constructDragAndDropPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = ["Layout"], additionInput = "") => {

    return `

        Here is my original react and tailwind source code: 
                
        ${renderCode}. 

        ${getPromptForBlendMode(blendMode)} ${targetCodeDropped === "" ? "the above code. " : `this specific piece taken from the above code: ${targetCodeDropped}. Change sections of the source code corresponding to this, as well as sections that are of similar layout or screen position to this. For example, don't just apply to one element in a list, but apply to all list elements with similar layouts.`}

        ${additionInput !== "" ? `Prioritize the user's instruction on blending details, make sure you follow it in your outputs:  ` + additionInput + `. Adapt the content and style of the added element to the ones of the code.` : ""}

        Sometimes the specific code piece does not correspond to parts of the source code, because it's rendered HTML based on the source React code. In that case, you need to identify the original code pieces from the source and modify them.

        A few rules:


        - First, explain in concise language the layout of the reference screenshot. Use it as a basis of your generation.
        - Make sure all text is legible on the background.
        - Briefly summarize the differences between the reference image and the code, summarize them into a few categories of changes you want to make. Pay attention to ${blendMode.join(" ")}. Base your later generation of categorizedChanges based on these categories.
        - Never directly pulls content from the reference to update the source code. For blending color and layout, preserve all original content in the UI for source code, only change/add the original content when it's really necessary for following a layout. When you blend in the addition mode, generate content based on the context of the source code.
        - Do not use list and .map functions to represent lists. Just generate HTML elements for each of the list items.
        - only use tailwind, react, and react icons. Follow the current code structure, do not include any import or export statements, just use a simple component definition () => {};
        - when adding icons, pick from this list of lucide react icons, do not use others: LuActivity, LuAirplay, LuAlertCircle, LuAlignCenter, LuAlignJustify, LuAlignLeft, LuAlignRight, LuAnchor, LuAperture, LuArchive, LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuAtSign, LuAward, LuBarChart, LuBattery, LuBell, LuBluetooth, LuBook, LuBookmark, LuBox, LuBriefcase, LuCalendar, LuCamera, LuCheck, LuCheckCircle, LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp, LuClipboard, LuClock, LuCloud, LuCode, LuCompass, LuCopy, LuCreditCard, LuCrop

        - There are a few stock photos for use under the folder /stock/, they are named after their orientation, like landscape0.jpg, landscape1.jpg, portrait0.jpg, etc. There are landscape images with index 0 to 9, and portrait 0 to 7. For example, you can use         <img src="/stock/portait0.jpg" alt="Example Image" />. There are also nature-themed pictures, named from nature_landscape0.jpg to nature_landscape4.jpg, and nature_portrait0.jpg to nature_portrait3.jpg.  Do not use any other images. Do not use placeholder image paths.
        - Summarize the code changes in your response, use the format "categorizedChanges:" followed by a list of changes. Be very concise in your explanations. For example, "Color change: section titles, from green to purple"; "Layout change: adapted the layout for [add the feature description of the changed code piece]".
        - When creating a bottom navigation bar, use "absolute bottom-0" instead of "fixed bottom-0".
        - Try to make colors and styles consistent and harmonious with the rest of the component.
        
        Return result as a JSON in the following format:
        
        {
            "designExplanation": // explain the design of the screenshot image, focus on layout and color, be really concise, less than 30 words
            "differences": // briefly summarize the differences between the reference image and the code, focus on layout orientation, spacing, color theme, font, etc.
            updatedCode: \`() => {}\`   // return the whole component for the entire screen, with the updates;
            // a list of objects listing the changes made, use the tailwind classes to indicate the changes
            categorizedChanges: [
                {
                    category: "",   // summarize the category of the below changes, group changes together semantically, e.g. "Color: Changed light to dark theme", "Layout: Increased spacing between elements", "Visual details: Increased corner roundedness", "Image: Decreased image size", "Font: Changed font appearance", etc.
                    changes: [{
                        type: "color",
                        before": // the tailwind class before the change,
                        "after": // the tailwind class after the change
                    }]
                }
            ]
        }

        here is a good example of the changes field:
        categorizedChanges: [
            {
                category: "Color: Changed light to dark theme",
                changes: [{
                    type: "color",
                    before: "bg-black",
                    after: "bg-white"
                }, {
                    type: "color",
                    before: "text-white",
                    after: "text-gray-900"
                }, {
                    type: "border",
                    before: "", // you can use empty before field to indicate addition of new classes
                    after: "border-2 border-gray-300/90"
                }, ...] // add as many as appropriate,
            },
            {
                category: "Font: Changed font appearance",
                changes: [{
                    type: "color",
                    before: "bg-black",
                    after: "bg-white"
                }, {
                    type: "font",
                    before: "text-sm",
                    after: "text-lg"
                }, ...] // add as many as appropriate,
            },
            
            ]

        `;
};


export const constructCodeReplacementPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = ["Layout"]) => {

    return `

        Here is my original react and tailwind source code: 
                
        ${renderCode}. 

        ${getPromptForBlendMode(blendMode)} ${targetCodeDropped === "" ? "the above code. " : `this specific piece taken from the above code: ${targetCodeDropped}. Change only the source code corresponding to this, and no other sections.`}

        Sometimes the specific code piece does not correspond to parts of the source code, because it's rendered HTML based on the source React code. In that case, you need to identify the original code pieces from the source and modify them.

        A few rules:


        - First, explain in concise language the layout of the reference screenshot. Use it as a basis of your generation.
        - Make sure all text is legible on the background.
        - Return (1) the piece(s) of the original source code you are changing (please refer to the original source code and I can simply use string.replace to find the original code section), and (2) the updated code pieces;
        - only use tailwind, react, and react icons. Do not include any import or export statements;
        - when adding icons, pick from this list of lucide react icons, do not use others: LuActivity, LuAirplay, LuAlertCircle, LuAlignCenter, LuAlignJustify, LuAlignLeft, LuAlignRight, LuAnchor, LuAperture, LuArchive, LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuAtSign, LuAward, LuBarChart, LuBattery, LuBell, LuBluetooth, LuBook, LuBookmark, LuBox, LuBriefcase, LuCalendar, LuCamera, LuCheck, LuCheckCircle, LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp, LuClipboard, LuClock, LuCloud, LuCode, LuCompass, LuCopy, LuCreditCard, LuCrop
        - Give an explanation summary of the original code piece you changed and the updated code piece in the returned result. In your response, use the field "explanations" followed by a numbered list of items. Be very concise in your explanations. For example, "Color change: section titles, from green to purple". Categorize all changes of the same type (color, layout, etc.) under one bullet point.
        - Try to make colors and styles consistent and harmonious with the rest of the component.
        - Never directly pulls content from the reference to update the source code. For blending color and layout, preserve all original content in the UI for source code, only change/add the original content when it's really necessary for following a layout. When you blend in the addition mode, generate content based on the context of the source code.
        - Do not use list and .map functions to represent lists. Just generate HTML elements for each of the list items.

        Return result as a JSON in the following format:

        {
            "designExplanation": // explain the design of the screenshot image, focus on layout and color, be really concise, less than 30 words
            "codeChanges": [{
                "originalCode": // original code piece
                "replacementCode": // replacement code
                }
                // ...
                // add more if needed
            ] // always put this in a list
            
                categorizedChanges: [
                {
                    category: "",   // summarize the category of the below changes, group changes together semantically, e.g. "Color: Changed light to dark theme", "Layout: Increased spacing between elements", "Visual details: Increased corner roundedness", "Image: Decreased image size", "Font: Changed font appearance", etc.
                    changes: [{
                        type: "color",
                        before": // the tailwind class before the change,
                        "after": // the tailwind class after the change
                    }]
                }
            ]
        }

        here is a good example of the changes field:
        categorizedChanges: [
            {
                category: "Color: Changed light to dark theme",
                changes: [{
                    type: "color",
                    before: "bg-black",
                    after: "bg-white"
                }, {
                    type: "color",
                    before: "text-white",
                    after: "text-gray-900"
                }, {
                    type: "border",
                    before: "", // you can use empty before field to indicate addition of new classes
                    after: "border-2 border-gray-300/90"
                }, ...] // add as many as appropriate,
            },
            {
                category: "Font: Changed font appearance",
                changes: [{
                    type: "color",
                    before: "bg-black",
                    after: "bg-white"
                }, {
                    type: "font",
                    before: "text-sm",
                    after: "text-lg"
                }, ...] // add as many as appropriate,
            },
            
            ]

        I will do sourceCode.replace(original_code, replacement_code) in my code, so make sure I can directly replace them and have the code still running.

        `;
};

export interface CodeChange {
    originalCode: string;
    replacementCode: string;
}

export interface ParsedData {
    codeChanges: CodeChange[];
    explanations: string;
}

function collectDeepestStrings(value: any, results: string[] = []): string[] {
    if (typeof value === 'string') {
        results.push(value);
    } else if (Array.isArray(value)) {
        for (const item of value) {
            collectDeepestStrings(item, results);
        }
    } else if (typeof value === 'object' && value !== null) {
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                collectDeepestStrings(value[key], results);
            }
        }
    }
    return results;
}

export function parseReplacementPromptResponse(jsonString: string): ParsedData {
    // Parse the input JSON string
    const data = JSON.parse(jsonString);

    // Extract code changes and map them into the desired format
    const codeChangesList: CodeChange[] = data.codeChanges.map((change: { originalCode: string; replacementCode: string }) => ({
        originalCode: change.originalCode,
        replacementCode: change.replacementCode
    }));

    // Extract the explanations string and concatenate the results
    const explanationsArray: string[] = collectDeepestStrings(data.explanations);
    const explanationsString: string = explanationsArray.join(' ');

    return {
        codeChanges: codeChangesList,
        explanations: explanationsString
    };
}