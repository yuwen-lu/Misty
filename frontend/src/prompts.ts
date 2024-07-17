// TODO give some images for the model to use
export const constructTextPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = [""]) => {

    return `Here is my react and tailwind code: 
                
        ${renderCode}. 

        Help me blend the prominent color of the reference image into ${targetCodeDropped === "" ? "the above code. " : `this specific piece taken from the above code: ${targetCodeDropped}. Change only the source code corresponding to this, and no other sections.`}

        Sometimes the specific code piece does not correspond to parts of the source code, because it's rendered HTML based on the source React code. In that case, you need to identify the original code pieces from the source and modify them.

        A few rules:

        1. return the whole component for the entire screen, with the updates;
        2. only use tailwind, react, and react icons. Follow the current code structure, do not include any import or export statements, just use a simple component definition () => {};
        3. Explain the original code piece you changed and the updated code piece in the returned result. In your response, use the format "Explanations:" followed by a numbered list of items. Be very concise in your explanations. For example, "Color change: section titles, from green to purple"

        Return result in the below format:

        () => {
            ... // the code
        }

        Explanations:
        ... // the explanations

        `;
};


export function parseResponse(response: string): string[] {
    const index = response.indexOf("() =>");
    if (index !== -1) {
        response = response.slice(index);
    } else {
        console.log("error: cannot find the code prefix for generated result")
    }
    const splitResponse = response.replace('```', '').split("Explanations:");
    return splitResponse;
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

    promptText += " the code we have. ";

    return promptText;
};

export const constructCodeReplacementPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = ["Color"]) => {

    return `

        Here is my original react and tailwind source code: 
                
        ${renderCode}. 

        ${getPromptForBlendMode(blendMode)} ${targetCodeDropped === "" ? "the above code. " : `this specific piece taken from the above code: ${targetCodeDropped}. Change only the source code corresponding to this, and no other sections.`}

        Sometimes the specific code piece does not correspond to parts of the source code, because it's rendered HTML based on the source React code. In that case, you need to identify the original code pieces from the source and modify them.

        A few rules:

        1. Return (1) the piece(s) of the original source code you are changing (please refer to the original source code and I can simply use string.replace to find the original code section), and (2) the updated code pieces;
        2. only use tailwind, react, and react icons. Do not include any import or export statements;
        3. Give an explanation summary of the original code piece you changed and the updated code piece in the returned result. In your response, use the field "explanations" followed by a numbered list of items. Be very concise in your explanations. For example, "Color change: section titles, from green to purple". Categorize all changes of the same type (color, layout, etc.) under one bullet point.
        4. Try to make colors and styles consistent and harmonious with the rest of the component.
        5. Never directly pulls content from the reference to update the source code. For blending color and layout, preserve all original content in the UI for source code, only change/add the original content when it's really necessary for following a layout. When you blend in the addition mode, generate content based on the context of the source code.

        Return result as a JSON in the following format:

        {
            "codeChanges": [{
                "originalCode": // original code piece
                "replacementCode": // replacement code
                }
                // ...
                // add more if needed
            ] // always put this in a list
            
            "explanations": // explanantion summary of the changes, just return one string
        }

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

export function parseJsonResponse(jsonString: string): ParsedData {
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