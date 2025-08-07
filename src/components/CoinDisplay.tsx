import React, { useState, useRef } from "react";
import { useCoins } from "../contexts/CoinContext";
import { useChat } from "../contexts/ChatContext";

const CoinDisplay: React.FC = () => {
    const { coins } = useCoins();
    const { sendChatMessage } = useChat();
    const [showMenu, setShowMenu] = useState(false);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setShowMenu(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setShowMenu(false);
        }, 500);
    };

    const handleFontPickingClick = () => {
        sendChatMessage("Help me pick a font for my design");
        setShowMenu(false);
    };

    const handleGenerateDesignClick = () => {
        // TODO: Implement generate design functionality
        setShowMenu(false);
    };

    return (
        <div
            className="fixed bottom-4 left-20 z-50"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Menu */}
            {showMenu && (
                <div
                    className="absolute bottom-full left-0 mb-2 font-bold bg-green-500 rounded-xl shadow-lg py-2 min-w-64 animate-slide-up"
                    style={{ fontFamily: "Geist Mono, cursive" }}
                >
                    <div className="px-4 py-3 text-white">
                        <div className="text-lg font-bold">Use Diamonds</div>
                        <div className="text-sm opacity-90 mt-1">Unlock more design help</div>
                    </div>

                    <button
                        onClick={coins >= 3 ? handleFontPickingClick : undefined}
                        disabled={coins < 3}
                        className={`w-full px-4 py-3 text-white flex items-center justify-between transition-colors rounded-lg ${
                            coins >= 3 ? 'hover:bg-green-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <span className="flex items-center">
                            <span className="text-2xl w-10 flex-shrink-0">📝</span>
                            <span className="font-medium text-left ml-1">
                                {coins >= 3 ? 'Pick Font' : 'Collect more to unlock'}
                            </span>
                        </span>
                        <span className="flex items-center space-x-2 text-md font-bold">
                            <span>3</span>
                            <span className="text-xl">💎</span>
                        </span>
                    </button>
                    <button
                        onClick={coins >= 5 ? handleGenerateDesignClick : undefined}
                        disabled={coins < 5}
                        className={`w-full px-4 py-3 text-white flex items-center justify-between transition-colors rounded-lg ${
                            coins >= 5 ? 'hover:bg-green-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <span className="flex items-center">
                            <span className="text-2xl w-10 flex-shrink-0">🎨</span>
                            <span className="font-medium text-left ml-1">
                                {coins >= 5 ? 'Generate Design' : 'Collect more to unlock'}
                            </span>
                        </span>
                        <span className="flex items-center space-x-2 text-md font-bold">
                            <span>5</span>
                            <span className="text-xl">💎</span>
                        </span>
                    </button>
                </div>
            )}

            {/* Diamond Display */}
            <div
                className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-1 font-bold text-lg cursor-pointer hover:bg-green-600 transition-colors"
                style={{ fontFamily: "Geist Mono, cursive" }}
            >
                <div className="w-12 h-12 flex items-center justify-center text-3xl">
                    💎
                </div>
                <span className="text-2xl font-bold pr-2 font-mono">
                    {coins.toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default CoinDisplay;
