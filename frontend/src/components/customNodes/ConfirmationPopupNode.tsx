import React, { useState, useEffect, useRef } from 'react';
import { Paintbrush, LayoutList, Plus } from 'lucide-react';
import { NodeProps } from 'reactflow';
import "../../index.css";
import { constructCodeReplacementPrompt, constructDragAndDropPrompt } from '../../prompts';
import { blurImage, convertToOutline, defaultBoundingBox } from '../../util';

const ConfirmationPopupNode: React.FC<NodeProps> = ({ id, data }) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<'select' | 'input'>('select');
    const [additionInput, setAdditionInput] = useState<string>('');
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
        if (selectedOptions.length > 0) {
            if (selectedOptions.includes('Addition')) {
                setCurrentStep('input'); // Switch to the input step
            } else {
                processBlend();
            }
        }
    };

    const processBlend = () => {
        console.log("Final selection: " + selectedOptions);

        const textPrompt = constructDragAndDropPrompt(data.renderCode, data.targetCodeDropped, selectedOptions, additionInput);

        console.log("Text prompt: " + textPrompt);

        const selectionIsLayout = selectedOptions.length === 1 && selectedOptions[0] === "Layout";
        let blurAmount = 4;
        if (selectionIsLayout) blurAmount = 2;

        blurImage(data.subImageScreenshot, blurAmount).then((blurredBase64) => {
            console.log("processed blurred image: " + blurredBase64);

            // if (selectionIsLayout) {
            //     convertToOutline(data.subImageScreenshot).then((outlineBase64) => {
            //         console.log("processed outline for the subimage: " + outlineBase64);
            //         data.handleFetchResponse(
            //             textPrompt,
            //             outlineBase64,
            //             true,
            //             data.targetRenderCodeNodeBbox ? data.targetRenderCodeNodeBbox : defaultBoundingBox,
            //             data.renderCode,
            //             data.targetCodeRenderNodeId,
            //             data.sourceNodeId
            //         );

            //     }).catch((err) => {
            //         console.error(err);
            //     });
            // } else {
                data.handleFetchResponse(
                    textPrompt,
                    blurredBase64,
                    true,
                    data.targetRenderCodeNodeBbox ? data.targetRenderCodeNodeBbox : defaultBoundingBox,
                    data.renderCode,
                    data.targetCodeRenderNodeId,
                    data.sourceNodeId,
                );
            // }
        }).catch((err) => {
            console.error(err);
        });

        setSelectedOptions([]);
        data.removeNode(id);
    };

    const cancelBlend = () => {
        console.log("confirmation popup closed");
        data.removeNode(id);
    };

    const goBack = () => {
        setCurrentStep('select');
    };

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
        >
            {currentStep === 'select' ? (
                <>
                    <div className="font-semibold text-l mb-5">
                        Pick Blending Option
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
                </>
            ) : (
                <>
                    <div className="font-semibold text-l mb-5 px-8">
                        Specify addition location
                    </div>
                    <div className="mt-3 w-full">
                        <label className="block text-s font-medium text-white mb-3">Placement Instructions</label>
                        <textarea
                            value={additionInput}
                            onChange={(e) => setAdditionInput(e.target.value)}
                            placeholder={`Describe where to place the element addition, e.g., below the "favorite books" title...`}
                            className="w-full h-24 px-2 py-1 text-gray-800 rounded-md"
                        />
                    </div>

                    <div className='flex w-full justify-around'>
                        <button
                            className="mt-5 px-5 py-3 bg-sky-500 hover:bg-sky-900 rounded-lg text-white font-semibold transition-colors"
                            onClick={goBack}
                        >
                            Back
                        </button>
                        <button
                            className={`mt-5 px-5 py-3  rounded-lg text-white font-semibold transition-colors ${additionInput ? "bg-sky-500 hover:bg-sky-900" : "bg-slate-400 cursor-auto"}`}
                            onClick={processBlend}
                            disabled={!additionInput}
                        >
                            Confirm
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ConfirmationPopupNode;
