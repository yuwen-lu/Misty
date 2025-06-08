import React, { useState, useEffect, useRef } from 'react';
import { Frown } from 'lucide-react';

interface ErrorPopupProps {
    message: string;
    duration?: number
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, duration = 3500 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        setShouldRender(true);
        const appearTimer = setTimeout(() => setIsVisible(true), 10);
        const durationTimer = setTimeout(() => {
            setIsVisible(false);
            const disappearTimer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // matches transition duration
            return () => clearTimeout(disappearTimer);
        }, duration);

        return () => {
            clearTimeout(appearTimer);
            clearTimeout(durationTimer);
        };
    }, [duration]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-sm w-full bg-red-100 border-l-4 border-red-500 rounded-md shadow-md transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
        >
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Frown className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorPopup;