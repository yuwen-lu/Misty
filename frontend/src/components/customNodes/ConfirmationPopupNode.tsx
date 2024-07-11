import React, { useState, useEffect, useRef } from 'react';
import { Paintbrush, LayoutList, Plus } from 'lucide-react';
import { NodeProps } from 'reactflow';
import "../../index.css";
import { constructCodeReplacementPrompt } from '../../prompts';
import { defaultBoundingBox } from '../../util';

const ConfirmationPopupNode: React.FC<NodeProps> = ({ id, data }) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const popupRef = useRef<HTMLDivElement>(null);

    const options = [
        { icon: Plus, title: 'Addition', description: 'Add the selected UI elements' },
        { icon: Paintbrush, title: 'Color', description: 'Apply the colors to your design' },
        { icon: LayoutList, title: 'Layout', description: 'Arrange and structure your design elements' },
    ];

    const handleSelection = (selection: string) => {
        if (selectedOptions.includes(selection)) {
            setSelectedOptions(selectedOptions.filter(option => option !== selection));
        } else {
            setSelectedOptions([...selectedOptions, selection]);
        }
    };

    const handleBlend = () => {
        // if nothing is selected, we don't do anything
        if (selectedOptions.length > 0) {
            console.log("Final selection: " + selectedOptions);
            // handle the prompt
            const textPrompt = constructCodeReplacementPrompt(data.renderCode, data.targetCodeDropped, selectedOptions);
            data.callOpenAI(textPrompt, data.subImageScreenshot, true, data.targetRenderCodeNodeBbox ? data.targetRenderCodeNodeBbox : defaultBoundingBox); // true for json mode

            // dismiss the node
            setSelectedOptions([]);
            data.removeNode(id);
        } 

    };

    const cancelBlend = () => {
        console.log("blend canceled");
        data.removeNode(id);
    }

    useEffect(() => {

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const optionTitle = target.getAttribute('data-title');
            if (optionTitle) {
                handleSelection(optionTitle);
                e.stopPropagation();
            }
        };

        const currentPopup = popupRef.current;
        if (currentPopup) {
            currentPopup.addEventListener('mousedown', handleClick);
        }

        return () => {
            if (currentPopup) {
                currentPopup.removeEventListener('mousedown', handleClick);
            }
        };
    }, [selectedOptions]);

    return (
        <div
            ref={popupRef}
            className="flex flex-col z-2000 items-center p-5 text-white bg-blue-900/80 shadow-lg transition-all duration-200 ease-in-out grow-animation"
        // style={{ top: data.position.y , left: data.position.x }}
        >
            <div className="font-semibold text-l mb-5">
                Pick A Blending Option
            </div>
            {options.map((option) => (
                <div
                    key={option.title}
                    data-title={option.title}
                >
                    <button
                        className={`relative flex items-center m-2 shadow-md rounded-md p-3 w-48 transition duration-200 ease-in-out ${selectedOptions.includes(option.title)
                            ? 'bg-slate-800/70 text-white'
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
            <div className='flex w-full justify-around'>
                <button
                    className="mt-5 px-5 py-3 bg-sky-500 hover:bg-sky-900 rounded-lg text-white font-semibold transition-colors"
                    onClick={cancelBlend}
                >
                    Cancel
                </button>
                <button
                    className={`mt-5 px-5 py-3  rounded-lg text-white font-semibold transition-colors ${selectedOptions.length > 0 ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400 cursor-auto"}`}
                    onClick={handleBlend}
                >
                    Blend
                </button>
            </div>
        </div>

    );
};

export default ConfirmationPopupNode;
