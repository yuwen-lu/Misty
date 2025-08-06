import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CoinContextType {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  celebrateCoins: (amount: number) => void;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const CoinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    const savedCoins = localStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('userCoins', coins.toString());
  }, [coins]);

  const addCoins = (amount: number) => {
    setCoins(prev => prev + amount);
  };

  const spendCoins = (amount: number): boolean => {
    if (coins >= amount) {
      setCoins(prev => prev - amount);
      return true;
    }
    return false;
  };

  const celebrateCoins = (amount: number) => {
    addCoins(amount);
    
    // Trigger confetti celebration
    const colors = ['#FFD700', '#00FF00', '#0099FF', '#FF6B6B', '#9B59B6'];
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });

    // Add a second burst after slight delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: colors,
      });
    }, 200);

    // Show celebration text
    const celebrationDiv = document.createElement('div');
    celebrationDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        color: #059669;
        padding: 20px 40px;
        border-radius: 50px;
        font-size: 2.5rem;
        font-weight: bold;
        font-family: monospace;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        border: 4px solid #059669;
        z-index: 9999;
        animation: bounce 0.6s ease-out;
      ">
        You earned ${amount} 💎!
        <br />
        Website opening...
      </div>
      <style>
        @keyframes bounce {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(celebrationDiv);
    
    // Remove the celebration text after 2 seconds
    setTimeout(() => {
      document.body.removeChild(celebrationDiv);
    }, 2000);
  };

  return (
    <CoinContext.Provider value={{ coins, addCoins, spendCoins, celebrateCoins }}>
      {children}
    </CoinContext.Provider>
  );
};

export const useCoins = () => {
  const context = useContext(CoinContext);
  if (context === undefined) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
};