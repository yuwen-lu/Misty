import React, { useState, useEffect } from 'react';
import { Eye, Brackets, Type, MoonStar, RotateCcw, ChevronRight } from 'lucide-react';
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
    fetchSemanticDiffingResponse: (code: string, targetNodeId: string, prevCode: string, discardCategory: string, addCategory: string, allCategories: string[]) => void;
    sethoverIdxList: (hoverIdxList: number[]) => void;
}

const DynamicUI: React.FC<DynamicUIProps> = ({ nodeId, categorizedChanges, prevCode, blendedCode, newCode, handleCodeReplacement, fetchSemanticDiffingResponse, sethoverIdxList }) => {
    const [state, setState] = useState<CategorizedChange[]>(() => categorizedChanges ? JSON.parse(JSON.stringify(categorizedChanges)) : []);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [categoryToggles, setCategoryToggles] = useState<boolean[]>(new Array(categorizedChanges.length).fill(true));


    useEffect(() => {
        console.log("toggles: " + categoryToggles.join(", "))
    }, [categoryToggles])

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAnimating) {
            timer = setTimeout(() => setIsAnimating(false), 500); // Total animation duration
        }
        return () => clearTimeout(timer);
    }, [isAnimating]);

    useEffect(() => {
        if (categorizedChanges) setState(JSON.parse(JSON.stringify(categorizedChanges)));
    }, [categorizedChanges]);

    const handleToggleCategory = async (categoryIndex: number) => {
        const category = state[categoryIndex];
        // get all other categories too
        let allActiveCategories: string[] = [];
        for (let i = 0; i < state.length; i++) {
            if (categoryToggles[i]) allActiveCategories.push(state[i].category);
        }

        const newToggles = [...categoryToggles];
        newToggles[categoryIndex] = !newToggles[categoryIndex];
        setCategoryToggles(newToggles);

        let updatedCode = blendedCode;

        if (!newToggles[categoryIndex]) {
            // If toggling off, reset the changes in this category
            const resetCategoryChanges = category.changes.map(change => ({
                ...change,
                after: change.before, // Revert to the original 'before' value
            }));
            const newState = [...state];
            newState[categoryIndex].changes = resetCategoryChanges;
            setState(newState);

            // Make the API call to discard changes in this category
            fetchSemanticDiffingResponse(prevCode, nodeId, blendedCode, category.category, "", allActiveCategories);

        } else {
            // If toggling on, reapply the changes in this category
            fetchSemanticDiffingResponse(prevCode, nodeId, blendedCode, "", category.category, allActiveCategories);
        }

        handleCodeReplacement(nodeId, updatedCode);
    };




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

    const tailwindTextSize = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];

    const getDropdownOptions = (currentValue: string) => {
        const [prefix, variant] = currentValue.split('-');
        let options = [];

        switch (prefix) {
            case 'bg':
                options = Object.keys(colorList).flatMap(color =>
                    Object.keys(colorList[color]).map(shade => `bg-${color}-${shade}`)
                ).concat(['bg-white', 'bg-black']);
                break;
            case 'text':
                if (tailwindTextSize.includes(variant) || variant === 'base') {
                    // Handle text sizes
                    options = tailwindTextSize.map(size => `text-${size}`);
                } else {
                    // Handle text colors
                    options = Object.keys(colorList).flatMap(color =>
                        Object.keys(colorList[color]).map(shade => `text-${color}-${shade}`)
                    ).concat(['text-white', 'text-black']);
                }
                break;
            case 'border':
                if (['t', 'b', 'l', 'r', 'x', 'y'].includes(variant)) {
                    // Handle border positions
                    options = ['t', 'b', 'l', 'r', 'x', 'y'].map(pos => `border-${pos}`);
                } else if (variant === undefined) {
                    // General border class (e.g., `border`)
                    options = ['border', 'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y'];
                } else {
                    // Handle border colors
                    options = Object.keys(colorList).flatMap(color =>
                        Object.keys(colorList[color]).map(shade => `border-${color}-${shade}`)
                    ).concat(['border-transparent', 'border-current', 'border-black', 'border-white']);
                }
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
                options = ['sm', 'md', 'lg', 'xl', '2xl', 'inner', 'none'].map(shadow => `shadow-${shadow}`);
                break;
            case 'font':
                options = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'].map(weight => `font-${weight}`);
                break;
            case 'rounded':
                options = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map(size => `rounded-${size}`);
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
        if (!isAnimating) {
            setIsAnimating(true);
        }

        // Reset all category toggles to `true`
        const resetToggles = categorizedChanges.map(() => true);
        setCategoryToggles(resetToggles);

        // Reset all changes to their initial state
        const resetChanges = categorizedChanges.map(category => ({
            ...category,
            changes: category.changes.map(change => ({
                ...change,
                after: change.before, // Reset 'after' to 'before'
            })),
        }));

        setState(resetChanges);

        // Apply the reset changes to the code
        handleCodeReplacement(nodeId, blendedCode);

        sethoverIdxList([]);
    };


    const getTagName = (tailwindClassName: string) => {
        switch (tailwindClassName) {
            case "mb":
                return "Bottom Margin";
            case "mt":
                return "Top Margin";
            case "ml":
                return "Left Margin";
            case "mr":
                return "Right Margin";
            case "mx":
                return "Horizontal Margin (Left & Right)";
            case "my":
                return "Vertical Margin (Top & Bottom)";
            case "m":
                return "Margin";
            case "pb":
                return "Bottom Padding";
            case "pt":
                return "Top Padding";
            case "pl":
                return "Left Padding";
            case "pr":
                return "Right Padding";
            case "px":
                return "Horizontal Padding (Left & Right)";
            case "py":
                return "Vertical Padding (Top & Bottom)";
            case "p":
                return "Padding";
            case "bg":
                return "Background Color";
            case "text":
                return "Text Color";
            case "border":
                return "Border Color";
            case "shadow":
                return "Shadow";
            case "rounded":
                return "Border Radius";
            case "font":
                return "Font";
            // Add more cases as needed based on your Tailwind utility classes
            default:
                return tailwindClassName.charAt(0).toUpperCase() + tailwindClassName.slice(1);
        }
    };



    return (
        <>
            {state.length === 0 ? <></> :
                <div className={`relative ${isExpanded ? 'flex w-full min-w-xl' : ''}`}>
                    <div className={`h-full flex items-center ${isExpanded ? 'ml-7 mr-5' : 'absolute left-7'}`} >
                        <button
                            onClick={() => setIsExpanded(currentIsExpanded => !currentIsExpanded)}
                            className="text-purple-900 h-full">
                            <ChevronRight className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={32} />
                        </button>
                    </div>
                    {isExpanded && <div className='flex flex-col  grow'>
                        <div className='relative items-begin mb-6'>
                            <div className='text-purple-900 absolute left-1/2 transform -translate-x-1/2 font-semibold text-xl '>
                                Applied Changes
                            </div>
                            <button
                                className='ml-auto flex items-center space-x-2 font-normal text-md text-purple-900 px-4 mt-12 rounded'
                                onClick={resetCode}>
                                <RotateCcw
                                    className={`transition-all duration-1500 ease-in-out ${isAnimating ? 'animate-complex-rotate' : ''
                                        }`}
                                />
                                <span>Reset All</span>
                            </button>
                        </div>

                        {state.map((category, categoryIndex) => {
                            const shouldShowCategory = category.changes.some(change => {
                                const shouldShowAfter = splitChanges(change.after).some(changeItem => getDropdownOptions(changeItem).length > 1);
                                return shouldShowAfter || change.before;
                            });

                            if (!shouldShowCategory) {
                                return null; // Hide the entire category if no changes should be shown
                            }

                            return (
                                <div key={category.category} className="mb-6 w-full flex flex-col items-start">
                                    <div className="font-semibold text-sm text-gray-500 mb-2 flex items-center">
                                        {category.category.split(": ")[0].toUpperCase()}
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <div className="font-semibold text-purple-900 mb-2 flex items-center">
                                            {category.category.split(": ")[1]}
                                        </div>
                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={categoryToggles[categoryIndex]}
                                                    onChange={() => handleToggleCategory(categoryIndex)}
                                                    className="sr-only"
                                                />
                                                <div className="block bg-white w-14 h-8 rounded-full"></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${categoryToggles[categoryIndex] ? 'transform translate-x-full bg-zinc-700 important' : 'bg-zinc-200'}`}></div>
                                            </div>
                                            <div className="ml-3 text-gray-700 font-medium">
                                                {categoryToggles[categoryIndex] ? 'On' : 'Off'}
                                            </div>
                                        </label>
                                    </div>

                                    {/* {category.changes.map((change, changeIndex) => {
                                        const shouldShowAfter = splitChanges(change.after).some(changeItem => getDropdownOptions(changeItem).length > 1);

                                        if (!change.before && !shouldShowAfter) {
                                            return null; // Hide the entire block if there's nothing to show
                                        }

                                        return (
                                            <div
                                                key={changeIndex}
                                                className={`flex items-center ml-4 mb-4 ${categoryToggles[categoryIndex] ? "visible" : "invisible"} `}
                                                onMouseEnter={() => sethoverIdxList(getIndexesToChange(prevCode, newCode, change.before, change.after))}
                                                onMouseLeave={() => sethoverIdxList([])}
                                                onClick={() => sethoverIdxList([])}
                                            >
                                                {shouldShowAfter && (
                                                    <div className="mr-4 text-black flex items-center flex-wrap">
                                                        {splitChanges(change.after).map((changeItem, changeItemIndex) => {
                                                            if (getDropdownOptions(changeItem).length > 1) {
                                                                return (
                                                                    <div className="w-full flex items-center my-2" key={changeItemIndex}>
                                                                        <span className="min-w-[150px]">{getTagName(changeItem.split("-")[0])}</span>
                                                                        <select
                                                                            key={changeItemIndex}
                                                                            className="p-2 bg-zinc-700 text-white rounded-lg"
                                                                            value={changeItem}
                                                                            onChange={(event) =>
                                                                                handleSelectChange(event, categoryIndex, changeIndex, changeItemIndex, change.before === undefined || change.before === "")
                                                                            }
                                                                        >
                                                                            {getDropdownOptions(changeItem).map(option => (
                                                                                <option key={option} value={option}>
                                                                                    {option}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })} */}
                                </div>
                            );
                        })}

                    </div>}
                </div>}
        </>
    );
};

export default DynamicUI;