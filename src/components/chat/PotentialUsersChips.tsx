import React from 'react';

interface PotentialUsersChipsProps {
  users: string[];
  onChipClick: (user: string) => void;
}

export const PotentialUsersChips: React.FC<PotentialUsersChipsProps> = ({ users, onChipClick }) => {
  return (
    <div className="mt-3 mb-2">
      <p className="text-xs text-gray-500 mb-2 font-medium">Click to add potential users:</p>
      <div className="flex flex-wrap gap-2">
      {users.map((user, index) => (
        <button
          key={index}
          onClick={() => onChipClick(user)}
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
          {user}
        </button>
      ))}
      </div>
    </div>
  );
};