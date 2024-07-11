export const constructTextPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = [""]) => {

    // TODO handle blendMode

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

export const constructCodeReplacementPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = [""]) => {

    return `

        Here is my original react and tailwind source code: 
                
        ${renderCode}. 

        Help me blend the prominent color of the reference image into ${targetCodeDropped === "" ? "the above code. " : `this specific piece taken from the above code: ${targetCodeDropped}. Change only the source code corresponding to this, and no other sections.`}

        Sometimes the specific code piece does not correspond to parts of the source code, because it's rendered HTML based on the source React code. In that case, you need to identify the original code pieces from the source and modify them.

        A few rules:

        1. Return (1) the piece(s) of the original source code you are changing (please refer to the original source code and I can simply use string.replace to find the original code section), and (2) the updated code pieces;
        2. only use tailwind, react, and react icons. Do not include any import or export statements;
        3. Give an explanation summary of the original code piece you changed and the updated code piece in the returned result. In your response, use the field "explanations" followed by a numbered list of items. Be very concise in your explanations. For example, "Color change: section titles, from green to purple". Categorize all changes of the same type (color, layout, etc.) under one bullet point.

        Return result as a JSON in the following format:

        {
            {
                "original code": // original code piece
                "replacement code": // replacement code
            }
            // ...
            // add more if needed
            
            "explanations": // explanantion summary of the changes, only once
        }

        I will do sourceCode.replace(original_code, replacement_code) in my code, so make sure I can directly replace them and have the code still running.

        `;
};