import React from 'react';

interface ConfirmationPopupProps {
    position: { x: number, y: number },
    setConfirmationSelection: React.Dispatch<React.SetStateAction<string>>;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ position, setConfirmationSelection }) => {
    const handleSelection = (selection: string) => {
        setConfirmationSelection(selection);
    };

    return (
        <div
            className="absolute bg-blue-900/70 p-4 rounded-lg text-white"
            style={{ top: position.y, left: position.x }}
        >
            <button
                className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded m-2"
                onClick={() => handleSelection('Style')}
            >
                Style
            </button>
            <button
                className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded m-2"
                onClick={() => handleSelection('Layout')}
            >
                Layout
            </button>
            <button
                className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded m-2"
                onClick={() => handleSelection('Addition')}
            >
                Addition
            </button>
        </div>
    );
};

export default ConfirmationPopup;
