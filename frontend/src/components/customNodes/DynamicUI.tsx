import React, { useState, useEffect, useRef } from 'react';
import { Eye, Brackets, Type, MoonStar, RotateCcw } from 'lucide-react';
import { formatCode, getIndexesToChange, splitChanges } from '../../util';
import { colorList } from "../../utilColors";
import "../../index.css";
import { CategorizedChange } from '../../prompts';

interface DynamicUIProps {
    nodeId: string;
    categorizedChanges: CategorizedChange[];
    prevCode: string;
    blendedCode: string;
    newCode: string;
    handleCodeReplacement: (nodeId: string, newCode: string) => void;
}

const DynamicUI: React.FC<DynamicUIProps> = ({ nodeId, categorizedChanges, prevCode, blendedCode, newCode, handleCodeReplacement }) => {
    const [state, setState] = useState<CategorizedChange[]>(() => categorizedChanges ? JSON.parse(JSON.stringify(categorizedChanges)) : []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Initialize local state when categorizedChanges prop changes
    useEffect(() => {
        setState(JSON.parse(JSON.stringify(categorizedChanges)));
    }, [categorizedChanges]);

    const tweakCodeDynamicUI = async (prevCode: string, newCode: string, oldValue: string, newValue: string, replacementValue: string): Promise<string> => {
        const indexesToChange: number[] = getIndexesToChange(prevCode, newCode, oldValue, newValue);
        let resultCode = newCode;

        const includesPrefix: boolean = newValue.includes("bg-") || newValue.includes("text-") || newValue.includes("border-");
        const replacementValueIncludesPrefix: boolean = replacementValue.includes("bg-") || replacementValue.includes("text-") || replacementValue.includes("border-");
        let attributePrefix = "";
        let targetValue = replacementValue;

        if (includesPrefix && !replacementValueIncludesPrefix) {
            attributePrefix = newValue.slice(0, newValue.indexOf("-") + 1);
            targetValue = attributePrefix + `[${replacementValue}]`;
        }

        for (const changeIdx of indexesToChange) {
            const startIdx = changeIdx;
            const endIdx = startIdx + newValue.length;
            resultCode = resultCode.slice(0, startIdx) + targetValue + resultCode.slice(endIdx);
        }

        try {
            resultCode = await formatCode(resultCode);
        } catch (err) {
            console.log("error in format code: " + err);
        }

        return resultCode;
    };

    const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>, categoryIndex: number, changeIndex: number) => {
        const { value } = event.target;
        const change = state[categoryIndex].changes[changeIndex];
        const updatedCode = await tweakCodeDynamicUI(prevCode, newCode, change.before, change.after, value);
        handleCodeReplacement(nodeId, updatedCode);

        const newState = [...state];
        newState[categoryIndex].changes[changeIndex].after = value;
        setState(newState);
    };

    const getDropdownOptions = (currentValue: string) => {
        const prefix = currentValue.split('-')[0];
        switch (prefix) {
            case 'bg':
                return Object.keys(colorList).flatMap(color =>
                    Object.keys(colorList[color]).map(shade => `${prefix}-${color}-${shade}`)
                );
            case 'text':
            case 'border':
                return Object.keys(colorList).flatMap(color =>
                    Object.keys(colorList[color]).map(shade => `${prefix}-${color}-${shade}`)
                );
            default:
                return [currentValue];
        }
    };

    const resetCode = () => {
        handleCodeReplacement(nodeId, blendedCode);
        setState(JSON.parse(JSON.stringify(categorizedChanges))); // Reset to initial changes
    };

    return (
        <>
            {state.length === 0 ? <></> : <div className="ml-20 max-w-xl relative">
                <div className="w-full flex items-center justify-between font-semibold text-purple-900 text-xl mb-5">
                    <div className="flex-1 text-center">Applied Changes</div>
                    <button
                        className='ml-auto flex items-center space-x-2 font-normal text-sm text-purple-900 hover:text-purple-700 hover:bg-purple-100 px-4 py-2 rounded'
                        onClick={resetCode}>
                        <RotateCcw />
                        <span>Reset All</span>
                    </button>
                </div>

                {state.map((category, categoryIndex) => (
                    <div key={category.category} className="mb-6 w-full flex flex-col items-start">
                        <div className="font-semibold text-purple-900 mb-2 flex items-center">
                            {category.category}
                        </div>
                        {category.changes.map((change, changeIndex) => (
                            <div key={changeIndex} className="flex items-center mb-4">
                                {change.before ? <div className="mr-4 text-black">Before: <span className="font-mono">{change.before}</span></div> : <></>}
                                <div className="mr-4 text-black flex items-center">
                                    <span>{change.before ? "After: " : "Added: "}</span>
                                    {splitChanges(change.after).map(changeItem =>
                                        <select
                                            className="p-2 ml-2 bg-gray-800 text-white rounded-lg"
                                            value={ changeItem }
                                            onChange={(event) => handleSelectChange(event, categoryIndex, changeIndex)}
                                        >
                                            {getDropdownOptions(changeItem).map(option => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>}
        </>
    );
};

export default DynamicUI;
