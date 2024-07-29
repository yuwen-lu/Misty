import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { Eye, Brackets, ALargeSmall, Type, MoonStar } from 'lucide-react';
import { NodeProps } from 'reactflow';

interface Change {
    type: string;
    before: string;
    after: string;
}

const DynamicUI: React.FC<NodeProps> = ({ id, data }) => {
    const [state, setState] = useState<Change[]>(data.changes);

    const handleColorChange = (index: number, color: ColorResult) => {
        const newState = [...state];
        newState[index].after = color.hex;
        setState(newState);
    };

    const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        const newState = [...state];
        newState[index].after = value;
        setState(newState);
    };

    return (
        <div className="flex flex-col items-center w-full h-full px-20 py-5 bg-purple-700 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg border-t-8 border-t-purple-900">
            <div className="w-full text-center font-semibold text-purple-900 text-xl mb-5">Changes</div>
            {state.map((change, index) => (
                <div key={index} className="mb-4 w-full flex flex-col items-start">
                    <div className="text-purple-900 mb-2 flex items-center">
                        {change.type === 'color' && <Eye className="mr-2" size={20}/>}
                        {change.type === 'border' && <Brackets className="mr-2" size={20}/>}
                        {change.type === 'text-size' && <ALargeSmall className="mr-2" size={20}/>}
                        {change.type === 'font-style' && <Type className="mr-2" size={20}/>}
                        {change.type === 'shadow' && <MoonStar className="mr-2" size={20}/>}
                        Change Type: {change.type}
                    </div>
                    {change.type === 'color' && (
                        <SketchPicker
                            color={change.after}
                            onChangeComplete={(color: ColorResult) => handleColorChange(index, color)}
                        />
                    )}
                    {change.type !== 'color' && (
                        <input
                            type="text"
                            name={change.type}
                            value={change.after}
                            onChange={(event) => handleInputChange(index, event)}
                            className="p-2 bg-gray-800 text-white rounded-lg w-full"
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default DynamicUI;
