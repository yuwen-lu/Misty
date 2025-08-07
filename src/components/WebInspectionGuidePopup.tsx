import React from 'react';

interface WebInspectionGuidePopupProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const WebInspectionGuidePopup: React.FC<WebInspectionGuidePopupProps> = ({
    isVisible,
    onClose,
    onConfirm,
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-yellow-50 rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg border-t-8 border-t-yellow-700 p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-yellow-900 flex items-center">
                        <span className="mr-2">🎨</span>
                        Design Inspection Guide
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-yellow-700 hover:text-yellow-900 transition-colors text-xl"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="mb-4">
                    <p className="text-sm text-yellow-700 mb-3">
                        When exploring this website, pay attention to:
                    </p>
                </div>

                <div className="mb-6">
                    <ul className="space-y-2 text-yellow-700 text-sm">
                        <li className="flex items-start">
                            <span className="font-semibold mr-2">Typography:</span>
                            <span>How many fonts are used? What styles?</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-semibold mr-2">Color palette:</span>
                            <span>Primary and accent colors</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-semibold mr-2">Visual hierarchy:</span>
                            <span>What draws your attention first?</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-semibold mr-2">Interactive elements:</span>
                            <span>Buttons, forms, navigation</span>
                        </li>
                    </ul>
                    <p className="text-sm text-yellow-700 mt-4 italic text-center bg-yellow-100 bg-opacity-50 p-3 rounded">
                        Come back to take notes on what you learned!
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center space-x-2 font-semibold"
                    >
                        <span>Let&apos;s inspect!</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebInspectionGuidePopup;