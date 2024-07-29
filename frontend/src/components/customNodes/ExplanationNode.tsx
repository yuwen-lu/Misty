import React from 'react';
import { NodeProps } from 'reactflow';
import { Change } from '../../prompts';


const parseString = (input: string | string[]): string[] => {
    const processString = (str: string): string[] => {
        // Split the string by the list item numbers
        return str.split(/\d+\.\s+/).filter(item => item.trim() !== '');
    };

    if (typeof input === 'string') {
        return processString(input);
    } else if (Array.isArray(input)) {
        // Process each string in the array and flatten the result
        return input.flatMap(processString);
    } else {
        throw new Error('Input must be a string or an array of strings');
    }
};

const parseObject = (input: Change[]): string[] => {
    return input.map(item => {
        const beforeText = item.before ? `before: ${item.before}` : "before: (empty)";
        const afterText = `after: ${item.after}`;
        return `type: ${item.type}, ${beforeText}, ${afterText}`;
    });
}


const ExplanationNode: React.FC<NodeProps> = ({ id, data }) => {

    let items;
    if (typeof data.text === 'object') {
        items = parseObject(data.text);
    } else {
        items = parseString(data.text);
    }
     

    return (
        <div className='max-w-lg flex flex-col items-center px-10 pb-10 shadow-lg rounded-lg text-white bg-purple-900/70 rounded-lg border-2 border-stone-400'>
            <div className='font-semibold text-lg my-7'>Changes Summary</div>
            <div>
                {items.map((item, index) => {
                    // const [title, ...content] = item.split(': ');
                    return (
                        <div key={index} style={{ marginBottom: '1rem' }}>
                            {/* <strong>{index + 1}. {title}:</strong>
                            <p>{content.join(': ')}</p> */}
                            <p>{item}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default ExplanationNode;