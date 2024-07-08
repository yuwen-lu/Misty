import React from 'react';
import { NodeProps } from 'reactflow';

type ParsedItem = {
    description: string;
    changes: string[];
};

const parseString = (input: string): string[] => {
    // Split the input string by the list item numbers
    return input.split(/\d+\.\s+/).filter(item => item.trim() !== '');
};


const ExplanationNode: React.FC<NodeProps> = ({ id, data }) => {

    const items = parseString(data.text);

    return (
        <div className='max-w-lg flex flex-col items-center px-10 pb-10 shadow-lg rounded-lg text-white bg-purple-900/70 rounded-lg border-2 border-stone-400'>
            <div className='font-semibold text-lg my-7'>Summary of Changes</div>
            <div>
                {items.map((item, index) => {
                    const [title, ...content] = item.split(': ');
                    return (
                        <div key={index} style={{ marginBottom: '1rem' }}>
                            <strong>{index + 1}. {title}:</strong>
                            <p>{content.join(': ')}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default ExplanationNode;