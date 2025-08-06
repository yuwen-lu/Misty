import React from 'react';
import { useCoins } from '../contexts/CoinContext';

const CoinDisplay: React.FC = () => {
  const { coins } = useCoins();

  return (
    <div className="fixed bottom-4 left-20 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-1 font-bold text-lg" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      <div className="w-12 h-12 flex items-center justify-center text-3xl">
        💎
      </div>
      <span className="text-2xl font-bold pr-2 font-mono">{coins.toLocaleString()}</span>
    </div>
  );
};

export default CoinDisplay;