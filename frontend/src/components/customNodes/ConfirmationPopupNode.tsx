import React, { useState, useEffect, useRef } from 'react';
import { Paintbrush, LayoutList, Plus } from 'lucide-react';
import { NodeProps } from 'reactflow';

const ConfirmationPopupNode: React.FC<NodeProps> = ({ data }) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const popupRef = useRef<HTMLDivElement>(null);

    const options = [
        { icon: Paintbrush, title: 'Style', description: 'Apply colors and visual styles' },
        { icon: LayoutList, title: 'Layout', description: 'Arrange and structure your design elements' },
        { icon: Plus, title: 'Addition', description: 'Add new UI elements to your design' },
    ];

    const handleSelection = (selection: string) => {
        if (selectedOptions.includes(selection)) {
            setSelectedOptions(selectedOptions.filter(option => option !== selection));
        } else {
            setSelectedOptions([...selectedOptions, selection]);
        }
        console.log("clicked and toggled: " + selection);
    };

    const handleBlend = () => {
        data.setConfirmationSelection(selectedOptions);
        console.log("Final selection: " + selectedOptions);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            e.stopPropagation();
        };

        const handleClick = (e: MouseEvent) => {
            e.stopPropagation();
            const target = e.target as HTMLElement;
            const optionTitle = target.getAttribute('data-title');
            if (optionTitle) {
                handleSelection(optionTitle);
            }
        };

        const currentPopup = popupRef.current;
        if (currentPopup) {
            currentPopup.addEventListener('mousedown', handleClick);
            currentPopup.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (currentPopup) {
                currentPopup.removeEventListener('mousedown', handleClick);
                currentPopup.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [selectedOptions]);

    return (
        <div
            ref={popupRef}
            className="flex flex-col items-center p-5 text-white bg-blue-900/80 rounded-lg shadow-lg transition-all duration-200 ease-in-out"
            style={{ top: data.position.y, left: data.position.x }}
        >
            <div className="font-semibold text-l mb-5">
                Confirm Blending Options
            </div>
            {options.map((option) => (
                <div
                    key={option.title}
                    data-title={option.title}
                >
                    <button
                        className={`relative flex items-center m-2 shadow-md rounded-md p-3 w-48 transition duration-200 ease-in-out ${selectedOptions.includes(option.title)
                                ? 'bg-slate-800/30 text-white'
                                : 'bg-white text-gray-800 hover:bg-blue-100'
                            }`}
                        data-title={option.title}
                    >
                        <option.icon
                            className={`absolute w-6 h-6 ${selectedOptions.includes(option.title) ? 'text-white' : 'text-blue-500'
                                }`}
                            data-title={option.title}
                        />
                        <div className={`flex flex-col text-left ml-10 ${selectedOptions.includes(option.title) ? '' : ''
                            }`} data-title={option.title}>
                            <h3 className="font-semibold mb-1" data-title={option.title}>{option.title}</h3>
                            <p className="text-xs" data-title={option.title}>{option.description}</p>
                        </div>
                    </button>
                </div>
            ))}
            <button
                className="mt-5 px-5 py-3 bg-sky-500 hover:bg-sky-900 rounded-lg text-white font-semibold transition-colors"
                onClick={handleBlend}
            >
                Blend
            </button>
        </div>

    );
};

export default ConfirmationPopupNode;
