import React, { useState, useRef, useEffect } from 'react';
import { Eye, Brackets, ALargeSmall, Type, MoonStar } from 'lucide-react';
import { formatCode, getIndexesToChange } from '../../util';
import { colorList } from "../../utilColors";
import "../../index.css"

interface Change {
    type: string;
    before: string;
    after: string;
}

interface DynamicUIProps {
    nodeId: string;
    changes: Change[];
    prevCode: string;
    newCode: string;
    handleCodeReplacement: (newCode: string, nodeId: string) => void;
}

const DynamicUI: React.FC<DynamicUIProps> = ({ nodeId, changes, prevCode, newCode, handleCodeReplacement }) => {
    const [state, setState] = useState<Change[]>(changes);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const colorBlockRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const tweakCodeDynamicUI = async (prevCode: string, newCode: string, oldValue: string, newValue: string, replacementValue: string): Promise<string> => {
        const indexesToChange: number[] = getIndexesToChange(prevCode, newCode, oldValue, newValue);
        console.log("Indexes to change: " + indexesToChange.forEach(idx => idx));
        let resultCode = newCode;


        const targetValue = (newValue.includes("bg-") || newValue.includes("text-") || newValue.includes("border-"))
            ? newValue.slice(0, newValue.indexOf("-") + 1) + `[${replacementValue}]`
            : replacementValue;


        for (const changeIdx of indexesToChange) {
            // Find the position to replace in the resultCode
            const startIdx = changeIdx;
            const endIdx = startIdx + newValue.length;
            // Replace the newValue at the calculated position with the replacementValue
            resultCode = resultCode.slice(0, startIdx) + targetValue + resultCode.slice(endIdx);
        }

        try {
            resultCode = await formatCode(resultCode);
        } catch (err) {
            console.log("error in format code: " + err);
        }

        console.log("Code replaced, replacing " + newValue + " with " + replacementValue + ", \n" + resultCode);

        return resultCode;
    };

    const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (editingIndex !== null) {
            const { value } = event.target;
            console.log("New value: " + value);

            // Await the asynchronous tweakCodeDynamicUI function
            const updatedCode = await tweakCodeDynamicUI(prevCode, newCode, state[editingIndex].before, state[editingIndex].after, value);
            handleCodeReplacement(nodeId, updatedCode);

            // Update state too
            const newState = [...state];
            newState[editingIndex].after = value;
            setState(newState);
        }
    };

    const getColorStyle = (className: string): string | undefined => {

        // TODO need to handle gradients. maybe just let the model deal with this?
        // TODO also need to deal with more than one class names

        const colorTag = className.replace(/(bg-|text-|border-)/, "");
        if (colorTag === "white") return "#ffffff";
        if (colorTag === "black") return "#000000";
        if (colorTag.includes("-")) {
            const [colorName, shade] = colorTag.split('-');
            return colorList[colorName] ? colorList[colorName][parseInt(shade, 10)] : colorTag;
        }
        return colorTag;
    };


    useEffect(() => {
        console.log("Prev code: " + prevCode);
        console.log("New Code: " + newCode);
    }, []);

    return (
        <>
            {state.length === 0 ? <></> : <div className="ml-20 relative" ref={containerRef}>
                <div className="w-full text-center font-semibold text-purple-900 text-xl mb-5">Applied Changes</div>
                {state.map((change, index) => (
                    <div key={index} className="mb-6 w-full flex flex-col items-start">
                        <div className="font-semibold text-purple-900 mb-2 flex items-center">
                            {change.type === 'color' && <Eye className="mr-2" />}
                            {change.type === 'border' && <Brackets className="mr-2" />}
                            {(change.type.includes('text') || (change.type.includes('font'))) && <Type className="mr-2" />}
                            {change.type === 'shadow' && <MoonStar className="mr-2" />}
                            Changed {change.type}
                        </div>
                        <div className="flex items-center">
                            <div className="mr-4 text-black">Before: <span className="font-mono">{change.before}</span></div>
                            <div className="mr-4 text-black flex items-center">
                                <span>After: {change.after} </span>
                                {change.type === 'color' ? (
                                    <span
                                        onFocus={() => setEditingIndex(index)}
                                        ref={editingIndex === index ? colorBlockRef : null}>
                                        <label className='custom-color-picker'>
                                            <input
                                                className="nodrag"
                                                type="color"
                                                onChange={handleInputChange}
                                                defaultValue={getColorStyle(change.after)}
                                            />
                                        </label>
                                    </span>
                                ) : (

                                    // TODO URGENT FIX THIS INPUT
                                    <input
                                        type="text"
                                        className="p-2 ml-2 bg-gray-800 text-white rounded-lg"
                                        value={change.after}
                                        onChange={handleInputChange}
                                        onFocus={() => setEditingIndex(index)}
                                    />

                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>}
        </>
    );
};

export default DynamicUI;
