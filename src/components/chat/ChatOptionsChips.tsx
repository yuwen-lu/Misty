import React from 'react';

interface ChatOptionsChipsProps {
  options: string[];
  onChipClick: (option: string) => void;
}

export const ChatOptionsChips: React.FC<ChatOptionsChipsProps> = ({ options, onChipClick }) => {
  return (
    <div className="mt-3 mb-2">
      <p className="text-xs text-gray-500 mb-2 font-medium">Select an option:</p>
      <div className="flex flex-wrap gap-2">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onChipClick(option)}
          className="
            px-3 py-1.5 
            text-sm font-medium
            bg-white/20 backdrop-blur-md
            border border-gray-200/50
            text-gray-700
            rounded-full
            hover:bg-white/40
            hover:border-gray-300/50
            active:bg-white/60
            active:scale-95
            transition-all duration-150
            shadow-sm hover:shadow-md
            cursor-pointer
            select-none
          "
        >
          {option}
        </button>
      ))}
      </div>
    </div>
  );
};