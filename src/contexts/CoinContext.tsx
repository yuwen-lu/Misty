import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { celebrateCoins as celebrateCoinsUtil, celebrateCoinsWithMessage } from '../utils/celebration';
import { checkForNewFeatureDiscovery, markFeatureAsDiscovered, DiscoverableFeature } from '../utils/featureDiscovery';

interface CoinContextType {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  celebrateCoins: (amount: number) => void;
  celebrateCoinsWithMessage: (amount: number, message: string) => void;
  // Feature discovery
  discoveredFeature: DiscoverableFeature | null;
  clearDiscoveredFeature: () => void;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const CoinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState<number>(0);
  const [discoveredFeature, setDiscoveredFeature] = useState<DiscoverableFeature | null>(null);
  const previousCoinsRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    const savedCoins = localStorage.getItem('userCoins');
    if (savedCoins) {
      const coinValue = parseInt(savedCoins, 10);
      setCoins(coinValue);
      previousCoinsRef.current = coinValue;
    }
    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    localStorage.setItem('userCoins', coins.toString());
    previousCoinsRef.current = coins;
  }, [coins]);

  const addCoins = (amount: number) => {
    setCoins(prev => {
      const newCoins = prev + amount;
      
      // Only check for feature discovery after initialization to avoid false triggers
      if (isInitializedRef.current) {
        const newFeature = checkForNewFeatureDiscovery(prev, newCoins);
        if (newFeature) {
          setDiscoveredFeature(newFeature);
          markFeatureAsDiscovered(newFeature.id);
        }
      }
      
      return newCoins;
    });
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
    celebrateCoinsUtil(amount);
  };

  const celebrateCoinsWithMessageFunc = (amount: number, message: string) => {
    addCoins(amount);
    celebrateCoinsWithMessage(amount, message);
  };

  const clearDiscoveredFeature = () => {
    setDiscoveredFeature(null);
  };

  return (
    <CoinContext.Provider value={{ 
      coins, 
      addCoins, 
      spendCoins, 
      celebrateCoins, 
      celebrateCoinsWithMessage: celebrateCoinsWithMessageFunc,
      discoveredFeature,
      clearDiscoveredFeature
    }}>
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