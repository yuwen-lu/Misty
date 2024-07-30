import React, { useState, useRef, useEffect } from 'react';
import { Eye, Brackets, ALargeSmall, Type, MoonStar } from 'lucide-react';
import { SketchPicker, ColorResult } from 'react-color';
import { coordinatePositionType } from '../../util';

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
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const { x, y, zoom } = useViewport();
    const colorBlockRef = useRef<HTMLDivElement | null>(null);
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerOffset, setContainerOffset] = useState<coordinatePositionType | null>(null);

    const handleColorChange = (color: ColorResult) => {
        if (editingIndex !== null) {
            const newState = [...state];
            newState[editingIndex].after = color.hex;
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

    const startEditing = (index: number, type: string) => {
        setEditingIndex(index);
        if (type === 'color') {
            setShowColorPicker(true);
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

    useEffect(() => {
        if (containerRef.current) {
            const newContainerOffset: coordinatePositionType = {
                x: containerRef.current.getBoundingClientRect().x,
                y: containerRef.current.getBoundingClientRect().y,
            };
            setContainerOffset(newContainerOffset);
        }
    }, [containerRef]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowColorPicker(false);
                setEditingIndex(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                        <div className="mr-4 text-black">After:
                            {change.type === 'color' ? (
                                <div
                                    ref={editingIndex === index ? colorBlockRef : null}
                                    className="inline-block border-2 border-white mx-2 w-6 h-6 rounded-lg cursor-pointer"
                                    style={{ backgroundColor: getColorStyle(change.after) }}
                                    onClick={() => startEditing(index, change.type)}
                                ></div>
                            ) : (
                                <span
                                    className="font-mono cursor-pointer"
                                    onClick={() => startEditing(index, change.type)}
                                >
                                    {change.after}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {showColorPicker && editingIndex !== null && (
                <div
                    ref={pickerRef}
                    className="fixed bottom-5 right-5 z-10 text-black"
                >
                    <SketchPicker
                        color={state[editingIndex].after}
                        onChangeComplete={handleColorChange}
                    />
                </div>
            )}
            {editingIndex !== null && state[editingIndex].type !== 'color' && (
                <div className="absolute z-10">
                    <input
                        type="text"
                        value={state[editingIndex].after}
                        onChange={handleInputChange}
                        className="p-2 bg-gray-800 text-white rounded-lg"
                    />
                </div>
            )}
        </div>
    );
};

export default DynamicUI;
