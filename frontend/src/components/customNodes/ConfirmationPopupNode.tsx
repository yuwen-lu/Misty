import React, { useState, useEffect, useRef } from 'react';
import { Paintbrush, LayoutList, Plus } from 'lucide-react';
import { NodeProps } from 'reactflow';


const ConfirmationPopupNode: React.FC<NodeProps> = ({ data }) => {
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const options = [
        { icon: Paintbrush, title: 'Style', description: 'Apply colors and visual styles to your design.' },
        { icon: LayoutList, title: 'Layout', description: 'Arrange and structure your design elements.' },
        { icon: Plus, title: 'Addition', description: 'Add new UI elements to your design.' },
    ];

    const handleSelection = (selection: string) => {
        data.setConfirmationSelection(selection);
        console.log("clicked");
    };

    useEffect(() => {
        const stopPropagation = (e: MouseEvent) => e.stopPropagation();

        const handleMouseMove = (e: MouseEvent) => {
            stopPropagation(e);
            console.log('Mouse move on popup');
        };

        const handleMouseUp = (e: MouseEvent) => {
            stopPropagation(e);
            console.log('Mouse up on popup');
        };

        const handleMouseEnter = (e: MouseEvent) => {
            console.log("Mouse enter")
            stopPropagation(e);
            const target = e.target as HTMLElement;
            const optionTitle = target.getAttribute('data-title');
            if (optionTitle) {
                setHoveredOption(optionTitle);
            }
        };

        const handleMouseLeave = (e: MouseEvent) => {
            stopPropagation(e);
            setHoveredOption(null);
        };

        const handleClick = (e: MouseEvent) => {
            stopPropagation(e);
            const target = e.target as HTMLElement;
            const optionTitle = target.getAttribute('data-title');
            if (optionTitle) {
                handleSelection(optionTitle);
            }
        };

        const currentPopup = popupRef.current;
        if (currentPopup) {
            currentPopup.addEventListener('mouseenter', handleMouseEnter);
            currentPopup.addEventListener('mouseleave', handleMouseLeave);
            currentPopup.addEventListener('click', handleClick);
            currentPopup.addEventListener('mousemove', handleMouseMove);
            currentPopup.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            if (currentPopup) {
                currentPopup.removeEventListener('mouseenter', handleMouseEnter);
                currentPopup.removeEventListener('mouseleave', handleMouseLeave);
                currentPopup.removeEventListener('click', handleClick);
                currentPopup.removeEventListener('mousemove', handleMouseMove);
                currentPopup.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, []);

    return (
        <div 
            ref={popupRef}
            className="flex flex-col bg-white rounded-full shadow-lg p-2 flex items-center transition-all duration-300 ease-in-out"
            style={{ top: data.position.y, left: data.position.x }}
        >
            {options.map((option) => (
                <div 
                    key={option.title}
                    className="relative flex items-center"
                    data-title={option.title}
                >
                    <button
                        className="p-2 rounded-full hover:bg-blue-50 transition duration-300"
                        data-title={option.title}
                    >
                        <option.icon className="w-6 h-6 text-blue-500" />
                    </button>
                    {hoveredOption === option.title && (
                        <div className="absolute left-full ml-2 bg-white shadow-md rounded-lg p-3 w-48 z-10">
                            <h3 className="font-semibold text-gray-800 mb-1">{option.title}</h3>
                            <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ConfirmationPopupNode;
