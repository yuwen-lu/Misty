// User interaction storage utilities for design generation context
import { loggedSessionStorage } from './localStorageLogger';

// Font selection interfaces
export interface FontSelection {
  category: string;
  fontName: string;
  fontFamily: string;
  personality: string;
  description: string;
  timestamp: Date;
}

export interface FontSelections {
  [category: string]: FontSelection;
}

// Design notes interfaces
export interface DesignNote {
  id: string;
  notes: string;
  timestamp: Date;
}

export interface WebsiteDesignNotes {
  [websiteName: string]: DesignNote[];
}

// User intent interfaces
export interface UserIntent {
  projectType?: string; // e.g., "blog website", "portfolio", "e-commerce"
  audience?: string; // e.g., "casual readers, students", "professionals"
  topic?: string; // e.g., "creative arts", "technology", "business"
  style?: string; // e.g., "modern", "minimalist", "creative"
  requirements?: string[]; // specific requirements mentioned
  timestamp: Date;
}

// Storage keys
const FONT_SELECTIONS_KEY = 'user-font-selections';
const DESIGN_NOTES_KEY = 'user-design-notes';
const USER_INTENT_KEY = 'user-design-intent';

// Font Selection Storage Functions
export const getUserFontSelections = (): FontSelections => {
  try {
    const stored = loggedSessionStorage.getItem(FONT_SELECTIONS_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    const selections: FontSelections = {};
    for (const [category, selection] of Object.entries(parsed)) {
      selections[category] = {
        ...(selection as any),
        timestamp: new Date((selection as any).timestamp)
      };
    }
    return selections;
  } catch (error) {
    console.error('Failed to get font selections:', error);
    return {};
  }
};

export const saveFontSelection = (
  category: string,
  fontName: string,
  fontFamily: string,
  personality: string,
  description: string
): void => {
  try {
    const currentSelections = getUserFontSelections();
    
    const newSelection: FontSelection = {
      category,
      fontName,
      fontFamily,
      personality,
      description,
      timestamp: new Date()
    };
    
    currentSelections[category] = newSelection;
    
    loggedSessionStorage.setItem(FONT_SELECTIONS_KEY, JSON.stringify(currentSelections));
  } catch (error) {
    console.error('Failed to save font selection:', error);
  }
};

export const removeFontSelection = (category: string): void => {
  try {
    const currentSelections = getUserFontSelections();
    delete currentSelections[category];
    
    loggedSessionStorage.setItem(FONT_SELECTIONS_KEY, JSON.stringify(currentSelections));
  } catch (error) {
    console.error('Failed to remove font selection:', error);
  }
};

export const clearAllFontSelections = (): void => {
  try {
    loggedSessionStorage.removeItem(FONT_SELECTIONS_KEY);
  } catch (error) {
    console.error('Failed to clear font selections:', error);
  }
};

// Design Notes Storage Functions
export const getUserDesignNotes = (): WebsiteDesignNotes => {
  try {
    const stored = loggedSessionStorage.getItem(DESIGN_NOTES_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    const notes: WebsiteDesignNotes = {};
    for (const [websiteName, notesList] of Object.entries(parsed)) {
      notes[websiteName] = (notesList as any[]).map(note => ({
        ...note,
        timestamp: new Date(note.timestamp)
      }));
    }
    return notes;
  } catch (error) {
    console.error('Failed to get design notes:', error);
    return {};
  }
};

export const addDesignNote = (
  websiteName: string,
  notes: string
): string => {
  try {
    const currentNotes = getUserDesignNotes();
    
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNote: DesignNote = {
      id: noteId,
      notes,
      timestamp: new Date()
    };
    
    if (!currentNotes[websiteName]) {
      currentNotes[websiteName] = [];
    }
    
    currentNotes[websiteName].push(newNote);
    
    loggedSessionStorage.setItem(DESIGN_NOTES_KEY, JSON.stringify(currentNotes));
    return noteId;
  } catch (error) {
    console.error('Failed to add design note:', error);
    return '';
  }
};

export const removeDesignNote = (websiteName: string, noteId: string): void => {
  try {
    const currentNotes = getUserDesignNotes();
    
    if (currentNotes[websiteName]) {
      currentNotes[websiteName] = currentNotes[websiteName].filter(note => note.id !== noteId);
      
      // Remove website entry if no notes left
      if (currentNotes[websiteName].length === 0) {
        delete currentNotes[websiteName];
      }
      
      loggedSessionStorage.setItem(DESIGN_NOTES_KEY, JSON.stringify(currentNotes));
    }
  } catch (error) {
    console.error('Failed to remove design note:', error);
  }
};

export const getDesignNotesForWebsite = (websiteName: string): DesignNote[] => {
  try {
    const allNotes = getUserDesignNotes();
    return allNotes[websiteName] || [];
  } catch (error) {
    console.error('Failed to get design notes for website:', error);
    return [];
  }
};

export const clearAllDesignNotes = (): void => {
  try {
    loggedSessionStorage.removeItem(DESIGN_NOTES_KEY);
  } catch (error) {
    console.error('Failed to clear design notes:', error);
  }
};

// User Intent Storage Functions
export const getUserIntent = (): UserIntent | null => {
  try {
    const stored = loggedSessionStorage.getItem(USER_INTENT_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
  } catch (error) {
    console.error('Failed to get user intent:', error);
    return null;
  }
};

export const updateUserIntent = (updates: Partial<UserIntent>): void => {
  try {
    const currentIntent = getUserIntent() || { timestamp: new Date() };
    
    const updatedIntent: UserIntent = {
      ...currentIntent,
      ...updates,
      timestamp: new Date()
    };
    
    loggedSessionStorage.setItem(USER_INTENT_KEY, JSON.stringify(updatedIntent));
  } catch (error) {
    console.error('Failed to update user intent:', error);
  }
};

export const addUserRequirement = (requirement: string): void => {
  try {
    const currentIntent = getUserIntent() || { timestamp: new Date() };
    const requirements = currentIntent.requirements || [];
    
    if (!requirements.includes(requirement)) {
      requirements.push(requirement);
      updateUserIntent({ requirements });
    }
  } catch (error) {
    console.error('Failed to add user requirement:', error);
  }
};

export const clearUserIntent = (): void => {
  try {
    loggedSessionStorage.removeItem(USER_INTENT_KEY);
  } catch (error) {
    console.error('Failed to clear user intent:', error);
  }
};

// Tool function for LLM to store user intent
export const storeUserIntent = (intent: Partial<UserIntent>): string => {
  try {
    updateUserIntent(intent);
    return `Successfully stored user intent: ${JSON.stringify(intent)}`;
  } catch (error) {
    console.error('Failed to store user intent:', error);
    return 'Failed to store user intent';
  }
};

// Utility function to compile all user interactions for design generation context
export const compileUserInteractionContext = (): string => {
  try {
    const fontSelections = getUserFontSelections();
    const designNotes = getUserDesignNotes();
    const userIntent = getUserIntent();
    
    let context = "User Design Preferences:\n\n";
    
    // Add user intent to context
    if (userIntent) {
      context += "PROJECT REQUIREMENTS:\n";
      if (userIntent.projectType) {
        context += `- Project Type: ${userIntent.projectType}\n`;
      }
      if (userIntent.audience) {
        context += `- Target Audience: ${userIntent.audience}\n`;
      }
      if (userIntent.topic) {
        context += `- Topic/Focus: ${userIntent.topic}\n`;
      }
      if (userIntent.style) {
        context += `- Style Preference: ${userIntent.style}\n`;
      }
      if (userIntent.requirements && userIntent.requirements.length > 0) {
        context += `- Additional Requirements: ${userIntent.requirements.join(', ')}\n`;
      }
      context += "\n";
    }
    
    // Add font selections to context
    if (Object.keys(fontSelections).length > 0) {
      context += "FONT SELECTIONS:\n";
      for (const [category, selection] of Object.entries(fontSelections)) {
        context += `- ${category}: ${selection.fontName} (${selection.personality}) - ${selection.description}\n`;
      }
      context += "\n";
    }
    
    // Add design notes to context
    if (Object.keys(designNotes).length > 0) {
      context += "DESIGN NOTES FROM WEBSITES:\n";
      for (const [websiteName, notes] of Object.entries(designNotes)) {
        context += `\n${websiteName}:\n`;
        notes.forEach((note, index) => {
          context += `  • ${note.notes}\n`;
        });
      }
      context += "\n";
    }
    
    if (!userIntent && Object.keys(fontSelections).length === 0 && Object.keys(designNotes).length === 0) {
      context += "No user preferences recorded yet.\n";
    }
    
    return context;
  } catch (error) {
    console.error('Failed to compile user interaction context:', error);
    return "Error compiling user preferences.";
  }
};

// Helper function to get summary statistics
export const getUserInteractionStats = (): {
  totalFontSelections: number;
  totalDesignNotes: number;
  websitesAnalyzed: number;
} => {
  try {
    const fontSelections = getUserFontSelections();
    const designNotes = getUserDesignNotes();
    
    return {
      totalFontSelections: Object.keys(fontSelections).length,
      totalDesignNotes: Object.values(designNotes).reduce((total, notes) => total + notes.length, 0),
      websitesAnalyzed: Object.keys(designNotes).length
    };
  } catch (error) {
    console.error('Failed to get user interaction stats:', error);
    return {
      totalFontSelections: 0,
      totalDesignNotes: 0,
      websitesAnalyzed: 0
    };
  }
};