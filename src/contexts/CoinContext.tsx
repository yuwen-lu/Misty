import React, { createContext, useContext, useState, useEffect } from 'react';

interface CoinContextType {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
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

  return (
    <CoinContext.Provider value={{ coins, addCoins, spendCoins }}>
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