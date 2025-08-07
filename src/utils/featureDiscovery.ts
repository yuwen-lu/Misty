// Feature discovery utility functions

export interface DiscoverableFeature {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
  threshold: number;
}

// Define all discoverable features
export const DISCOVERABLE_FEATURES: DiscoverableFeature[] = [
  {
    id: 'pick-font',
    name: 'Pick Font',
    icon: '📝',
    cost: 3,
    description: 'Get AI-powered font recommendations for your designs',
    threshold: 3
  },
  {
    id: 'generate-design', 
    name: 'Generate Design',
    icon: '🎨',
    cost: 5,
    description: 'Create custom design concepts with AI assistance',
    threshold: 5
  }
];

const STORAGE_KEY = 'discovered-features';

// Get list of features that have been discovered (shown to user)
export const getDiscoveredFeatures = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Mark a feature as discovered
export const markFeatureAsDiscovered = (featureId: string): void => {
  try {
    const discovered = getDiscoveredFeatures();
    if (!discovered.includes(featureId)) {
      discovered.push(featureId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(discovered));
    }
  } catch (error) {
    console.error('Failed to mark feature as discovered:', error);
  }
};

// Check if a feature has been discovered
export const isFeatureDiscovered = (featureId: string): boolean => {
  return getDiscoveredFeatures().includes(featureId);
};

// Get features that should be discovered based on current diamond count
export const getFeaturesToDiscover = (currentDiamonds: number): DiscoverableFeature[] => {
  const discovered = getDiscoveredFeatures();
  
  return DISCOVERABLE_FEATURES.filter(feature => 
    currentDiamonds >= feature.threshold && !discovered.includes(feature.id)
  );
};

// Check if any new features should be discovered when diamonds change
export const checkForNewFeatureDiscovery = (
  previousDiamonds: number, 
  currentDiamonds: number
): DiscoverableFeature | null => {
  // Only check if diamonds increased
  if (currentDiamonds <= previousDiamonds) {
    return null;
  }

  // Find features that were just unlocked (including those we jumped past)
  const newlyUnlockedFeatures = DISCOVERABLE_FEATURES.filter(feature => 
    previousDiamonds < feature.threshold && 
    currentDiamonds >= feature.threshold &&
    !isFeatureDiscovered(feature.id)
  );

  // Return the LOWEST threshold feature that was just unlocked
  // This ensures we show features in order (Pick Font before Generate Design)
  return newlyUnlockedFeatures.sort((a, b) => a.threshold - b.threshold)[0] || null;
};