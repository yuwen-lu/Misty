// Session storage logging utility
// Wraps sessionStorage operations with logging functionality

interface LoggedStorageEvent {
  operation: 'setItem' | 'getItem' | 'removeItem' | 'clear';
  key?: string;
  value?: string;
  previousValue?: string | null;
  timestamp: Date;
}

const logStorageOperation = (event: LoggedStorageEvent) => {
  const { operation, key, value, previousValue, timestamp } = event;
  
  switch (operation) {
    case 'setItem':
      console.log(`🔄 sessionStorage.setItem`, {
        key,
        newValue: value,
        previousValue,
        timestamp: timestamp.toISOString(),
        changed: previousValue !== value
      });
      break;
    case 'getItem':
      console.log(`📖 sessionStorage.getItem`, {
        key,
        value,
        timestamp: timestamp.toISOString()
      });
      break;
    case 'removeItem':
      console.log(`🗑️ sessionStorage.removeItem`, {
        key,
        removedValue: previousValue,
        timestamp: timestamp.toISOString()
      });
      break;
    case 'clear':
      console.log(`🧹 sessionStorage.clear`, {
        timestamp: timestamp.toISOString()
      });
      break;
  }
};

// Logged sessionStorage wrapper
export const loggedSessionStorage = {
  setItem: (key: string, value: string): void => {
    const previousValue = sessionStorage.getItem(key);
    sessionStorage.setItem(key, value);
    
    logStorageOperation({
      operation: 'setItem',
      key,
      value,
      previousValue,
      timestamp: new Date()
    });
  },

  getItem: (key: string): string | null => {
    const value = sessionStorage.getItem(key);
    
    logStorageOperation({
      operation: 'getItem',
      key,
      value: value || undefined,
      timestamp: new Date()
    });
    
    return value;
  },

  removeItem: (key: string): void => {
    const previousValue = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    
    logStorageOperation({
      operation: 'removeItem',
      key,
      previousValue,
      timestamp: new Date()
    });
  },

  clear: (): void => {
    sessionStorage.clear();
    
    logStorageOperation({
      operation: 'clear',
      timestamp: new Date()
    });
  }
};