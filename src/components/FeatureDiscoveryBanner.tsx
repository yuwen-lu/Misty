import React, { useEffect, useState } from "react";

interface FeatureDiscoveryBannerProps {
    isVisible: boolean;
    onClose: () => void;
    feature: {
        name: string;
        icon: string;
        cost: number;
        description: string;
    };
}

const FeatureDiscoveryBanner: React.FC<FeatureDiscoveryBannerProps> = ({
    isVisible,
    onClose,
    feature,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            // Auto-close after 6 seconds
            const autoCloseTimer = setTimeout(() => {
                handleClose();
            }, 4000);

            return () => clearTimeout(autoCloseTimer);
        }
    }, [isVisible]);

    const handleClose = () => {
        setIsAnimating(false);
        // Wait for animation to complete before hiding
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
                isAnimating
                    ? "translate-y-0 opacity-100"
                    : "translate-y-full opacity-0"
            }`}
        >
            <div className="font-mono bg-green-900 text-white px-6 py-4 rounded-xl shadow-2xl max-w-lg mx-4 relative overflow-hidden">

                {/* Content */}
                <div className="flex items-center space-x-4 pr-6">
                    {/* Text content */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg font-bold">
                                New Tool Unlocked!
                            </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg mr-2">
                                {feature.icon}
                            </span>
                            <span className="font-bold text-green-100">
                                {feature.name}
                            </span>
                        </div>

                        <p className="text-green-100 text-sm">
                            {feature.description}
                        </p>
                    </div>
                </div>

                {/* Progress indicator */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-green-500 rounded-b-xl"
                    style={{
                        animation: "shrinkWidth 4000ms linear forwards",
                        width: "100%",
                    }}
                ></div>
            </div>

            {/* Inline styles for progress bar animation */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
          @keyframes shrinkWidth {
            from { width: 100%; }
            to { width: 0%; }
          }
        `,
                }}
            />
        </div>
    );
};

export default FeatureDiscoveryBanner;
