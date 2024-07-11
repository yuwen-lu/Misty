export const constructTextPrompt = (renderCode: string, targetCodeDropped: string, blendMode: string[] = [""]) => {

    // TODO handle blendMode
    
    return `Here is my react and tailwind code: 
                
        ${renderCode}. 

        Help me blend the prominent color of the reference image into ${targetCodeDropped === "" ? "the above code. " : `this specific piece taken from the above code: ${targetCodeDropped}`}

        A few rules:

        1. return the whole component for the entire screen, with the updates;
        2. only use tailwind, react, and react icons. Follow the current code structure, do not include any export or import statements, just use a simple component definition () => {}
        3. Explain what you changed. In your response, use the format "Explanations:" followed by a numbered list of items. Be very concise in your explanations. For example, "Color change: section titles, from green to purple"

        `;
};