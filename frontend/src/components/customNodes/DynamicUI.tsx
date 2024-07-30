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
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const [pickerPosition, setPickerPosition] = useState<coordinatePositionType | null>(null);
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
        if (showColorPicker && pickerRef.current) {
            const newPickerPos: coordinatePositionType = {
                x: pickerRef.current.getBoundingClientRect().x,
                y: pickerRef.current.getBoundingClientRect().y
            };
            setPickerPosition(newPickerPos);
        }
    }, [showColorPicker]);

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
        if (editingIndex !== null && pickerRef.current) {
            const newPickerPos: coordinatePositionType = {
                x: pickerRef.current.getBoundingClientRect().x,
                y: pickerRef.current.getBoundingClientRect().y
            };
            setPickerPosition(newPickerPos);
        }
    }, [editingIndex, x, y, zoom]);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            console.log("mouse down!!");
            if (pickerRef.current && pickerRef.current.contains(e.target as Node)) {
                console.log("target in!!");
                e.preventDefault();
                e.stopPropagation();
            } else {
                console.log("target not in!!");
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (pickerRef.current && pickerRef.current.contains(e.target as Node)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (pickerRef.current && pickerRef.current.contains(e.target as Node)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleMouseLeave = (e: MouseEvent) => {
            e.stopPropagation();
        };

        const containerElement = containerRef.current;
        if (containerElement) {
            containerElement.addEventListener('mousedown', handleMouseDown);
            containerElement.addEventListener('mousemove', handleMouseMove);
            containerElement.addEventListener('mouseup', handleMouseUp);
            containerElement.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (containerElement) {
                containerElement.removeEventListener('mousedown', handleMouseDown);
                containerElement.removeEventListener('mousemove', handleMouseMove);
                containerElement.removeEventListener('mouseup', handleMouseUp);
                containerElement.removeEventListener('mouseleave', handleMouseLeave);
            }
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
                                    ref={editingIndex === index ? pickerRef : null}
                                    className="inline-block border-2 border-white mx-2 w-6 h-6 rounded-lg cursor-pointer"
                                    style={{ backgroundColor: getColorStyle(change.after) }}
                                    onClick={(e) => { startEditing(index, change.type); e.stopPropagation(); e.preventDefault(); }}
                                ></div>
                            ) : (
                                <span
                                    className="font-mono cursor-pointer"
                                    onClick={(e) => { startEditing(index, change.type); e.stopPropagation(); e.preventDefault(); }}
                                >
                                    {change.after}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {showColorPicker && editingIndex !== null && pickerPosition && containerOffset && (
                <div
                    className="absolute z-10"
                    style={{
                        left: (pickerPosition.x - x) / zoom - containerOffset.x,
                        top: (pickerPosition.y - y) / zoom - containerOffset.y,
                    }}
                >
                    <div className="fixed inset-0" onClick={() => setShowColorPicker(false)}></div>
                    <SketchPicker
                        color={state[editingIndex].after}
                        onChangeComplete={(color: ColorResult) => handleColorChange(color)}
                    />
                </div>
            )}
            {editingIndex !== null && state[editingIndex].type !== 'color' && (
                <div className="absolute z-10">
                    <div className="fixed inset-0" onClick={() => setEditingIndex(null)}></div>
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
