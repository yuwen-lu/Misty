import React, { useState, useRef, useEffect } from 'react';
import { Eye, Brackets, ALargeSmall, Type, MoonStar } from 'lucide-react';
import { coordinatePositionType } from '../../util';
import "../../index.css"

interface Change {
    type: string;
    before: string;
    after: string;
}

interface DynamicUIProps {
    changes: Change[];
    useViewport: () => { x: number, y: number, zoom: number };
}

const DynamicUI: React.FC<DynamicUIProps> = ({ changes, useViewport }) => {
    const [state, setState] = useState<Change[]>(changes);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const colorBlockRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (editingIndex !== null) {
            const newState = [...state];
            const color = event.target.value;
            newState[editingIndex].after = color;
            setState(newState);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (editingIndex !== null) {
            const { value } = event.target;
            const newState = [...state];
            newState[editingIndex].after = value;
            setState(newState);
        }
    };

    const getColorStyle = (className: string) => {
        const colorClasses: { [key: string]: string } = {
            'bg-black': '#000000',
            'bg-white': '#FFFFFF',
            'text-white': '#FFFFFF',
            'text-gray-900': '#1A202C',
            'bg-gray-800': '#2D3748',
            'border-gray-500/90': '#6B7280',
            'border-gray-200': '#E5E7EB'
        };
        return colorClasses[className] || className;
    };

    return (
        <div className="ml-20 relative" ref={containerRef}>
            <div className="w-full text-center font-semibold text-purple-900 text-xl mb-5">Dynamic UI Tweaks</div>
            {state.map((change, index) => (
                <div key={index} className="mb-6 w-full flex flex-col items-start">
                    <div className="font-semibold text-purple-900 mb-2 flex items-center">
                        {change.type === 'color' && <Eye className="mr-2" />}
                        {change.type === 'border' && <Brackets className="mr-2" />}
                        {change.type === 'text-size' && <ALargeSmall className="mr-2" />}
                        {change.type === 'font-style' && <Type className="mr-2" />}
                        {change.type === 'shadow' && <MoonStar className="mr-2" />}
                        Changed {change.type}
                    </div>
                    <div className="flex items-center">
                        <div className="mr-4 text-black">Before: <span className="font-mono">{change.before}</span></div>
                        <div className="mr-4 text-black flex items-center">
                            <span>After: </span>
                            {change.type === 'color' ? (
                                <span
                                    ref={editingIndex === index ? colorBlockRef : null}>
                                    <label className='custom-color-picker'>
                                        <input
                                            className="nodrag"
                                            type="color"
                                            onChange={handleColorChange}
                                            defaultValue={getColorStyle(change.after)}
                                        />
                                    </label>
                                </span>
                            ) : (

                                // TODO URGENT FIX THIS INPUT
                                <input
                                    type="text"
                                    value={change.after}
                                    onChange={handleInputChange}
                                    className="p-2 ml-2 bg-gray-800 text-white rounded-lg"
                                />

                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DynamicUI;
