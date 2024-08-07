import React, { useState, useEffect } from 'react';
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
    sethoverIdxList: (hoverIdxList: number[]) => void;
}

const DynamicUI: React.FC<DynamicUIProps> = ({ nodeId, categorizedChanges, prevCode, blendedCode, newCode, handleCodeReplacement, sethoverIdxList }) => {
    const [state, setState] = useState<CategorizedChange[]>(() => categorizedChanges ? JSON.parse(JSON.stringify(categorizedChanges)) : []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    useEffect(() => {
        if (categorizedChanges) setState(JSON.parse(JSON.stringify(categorizedChanges)));
    }, [categorizedChanges]);

    const tweakCodeDynamicUI = async (prevCode: string, newCode: string, oldValue: string, newValue: string, replacementValue: string): Promise<string> => {
        const indexesToChange: number[] = getIndexesToChange(prevCode, newCode, oldValue, newValue);
        console.log("indexes to change: " + indexesToChange);
        console.log("new value length: " + newValue.length);
        console.log("looking for values: " + newValue + ", target values: " + newCode.slice(indexesToChange[0], indexesToChange[0] + newValue.length));
        let resultCode = newCode;

        const includesPrefix: boolean = newValue.includes("bg-") || newValue.includes("text-") || newValue.includes("border-");
        const replacementValueIncludesPrefix: boolean = replacementValue.includes("bg-") || replacementValue.includes("text-") || replacementValue.includes("border-");
        let attributePrefix = "";
        let targetValue = replacementValue;

        if (includesPrefix && !replacementValueIncludesPrefix) {
            attributePrefix = newValue.slice(0, newValue.indexOf("-") + 1);
            targetValue = attributePrefix + `[${replacementValue}]`;
        }

        // Process replacements from back to front, so the replacement will not impact the index
        for (let i = indexesToChange.length - 1; i >= 0; i--) {
            const changeIdx = indexesToChange[i];
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

    const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>, categoryIndex: number, changeIndex: number, changeItemIndex: number, newItem: boolean = false) => {
        const { value } = event.target;
        const change = state[categoryIndex].changes[changeIndex];
        const splitChangeAfter = splitChanges(change.after);
        splitChangeAfter[changeItemIndex] = value;
        const updatedChangeAfter = splitChangeAfter.join(' ');

        let updatedCode = "";
        if (newItem) {
            updatedCode = newCode.replaceAll(change.after, updatedChangeAfter);
        } else {
            updatedCode = await tweakCodeDynamicUI(prevCode, newCode, change.before, change.after, updatedChangeAfter);
        }
        handleCodeReplacement(nodeId, updatedCode);

        const newState = [...state];
        newState[categoryIndex].changes[changeIndex].after = updatedChangeAfter;
        setState(newState);
    };

    const getDropdownOptions = (currentValue: string) => {
        const prefix = currentValue.split('-')[0];
        let options = [];
        switch (prefix) {
            case 'bg':
            case 'text':
            case 'border':
                options = Object.keys(colorList).flatMap(color =>
                    Object.keys(colorList[color]).map(shade => `${prefix}-${color}-${shade}`)
                ).concat([`${prefix}-white`, `${prefix}-black`]);
                break;
            case 'mt':
            case 'mb':
            case 'ml':
            case 'mr':
            case 'mx':
            case 'my':
            case 'p':
            case 'pt':
            case 'pb':
            case 'pl':
            case 'pr':
            case 'px':
            case 'py':
                options = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '56', '64'].map(size => `${prefix}-${size}`);
                break;
            case 'shadow':
                options = ['sm', 'md', 'lg', 'xl', '2xl', 'inner', 'none'].map(shadow => `${prefix}-${shadow}`);
                break;
            case 'rounded':
                options = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map(size => `${prefix}-${size}`);
                break;
            default:
                options = [currentValue];
                break;
        }
        if (!options.includes(currentValue)) {
            options.unshift(currentValue);
        }
        return options;
    };

    const resetCode = () => {
        handleCodeReplacement(nodeId, blendedCode);
        sethoverIdxList([]);
        setState(JSON.parse(JSON.stringify(categorizedChanges))); // Reset to initial changes
    };

    return (
        <>
            {state.length === 0 ? <></> : <div className="ml-20 max-w-xl relative">
                <div className="w-full flex items-center justify-between font-semibold text-purple-900 text-xl mb-5">
                    <div className="flex-1 text-center">Applied Changes</div>
                    <button
                        className='ml-auto flex items-center space-x-2 font-normal text-md text-purple-900 hover:text-purple-700 hover:bg-purple-100 px-4 py-2 rounded'
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
                            <div
                                key={changeIndex}
                                className="flex items-center ml-4 mb-4"
                                onMouseEnter={() => sethoverIdxList(getIndexesToChange(prevCode, newCode, change.before, change.after))}
                                onMouseLeave={() => sethoverIdxList([])}
                            >
                                {change.before ? <div className="mr-4 text-black">Before: <span className="font-mono">{change.before}</span></div> : <></>}
                                <div className="mr-4 text-black flex items-center flex-wrap	">
                                    <span>{change.before ? "After: " : "Added: "}</span>
                                    {splitChanges(change.after).map((changeItem, changeItemIndex) =>
                                        <select
                                            key={changeItemIndex}
                                            className="p-2 ml-2 my-2 bg-gray-800 text-white rounded-lg"
                                            value={changeItem}
                                            onChange={(event) => handleSelectChange(event, categoryIndex, changeIndex, changeItemIndex, change.before === undefined || change.before === "")}
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