import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LuInfo } from 'react-icons/lu';
import { useCoins } from '../../contexts/CoinContext';
import { saveFontSelection, removeFontSelection, getUserFontSelections } from '../../utils/userInteractionStorage';

interface FontData {
  name: string;
  fontFamily: string;
  personality: string;
  description: string;
}

interface FontCategory {
  title: string;
  fonts: FontData[];
}

const fontCategories: FontCategory[] = [
  {
    title: 'Sans Serif',
    fonts: [
      {
        name: 'Inter',
        fontFamily: 'Inter',
        personality: 'Modern & Professional',
        description: 'Clean, readable, perfect for tech and business'
      },
      {
        name: 'Roboto',
        fontFamily: 'Roboto',
        personality: 'Friendly & Approachable',
        description: 'Google\'s humanist font, great for apps'
      },
      {
        name: 'Poppins',
        fontFamily: 'Poppins',
        personality: 'Rounded & Warm',
        description: 'Geometric with friendly curves'
      },
      {
        name: 'Montserrat',
        fontFamily: 'Montserrat',
        personality: 'Urban & Contemporary',
        description: 'Inspired by old Buenos Aires signs'
      },
      {
        name: 'Oswald',
        fontFamily: 'Oswald',
        personality: 'Bold & Impactful',
        description: 'Condensed, great for headers'
      },
      {
        name: 'Geist',
        fontFamily: 'Geist',
        personality: 'Clean & Technical',
        description: 'Modern system font, great for interfaces'
      }
    ]
  },
  {
    title: 'Serif',
    fonts: [
      {
        name: 'Playfair Display',
        fontFamily: 'Playfair Display',
        personality: 'Elegant & Luxurious',
        description: 'High contrast, perfect for fashion/luxury'
      },
      {
        name: 'Merriweather',
        fontFamily: 'Merriweather',
        personality: 'Traditional & Readable',
        description: 'Designed for screens, very legible'
      },
      {
        name: 'Crimson Text',
        fontFamily: 'Crimson Text',
        personality: 'Literary & Scholarly',
        description: 'Classic book typography feel'
      }
    ]
  },
  {
    title: 'Decorative',
    fonts: [
      {
        name: 'Dancing Script',
        fontFamily: 'Dancing Script',
        personality: 'Playful & Creative',
        description: 'Handwritten feel, use sparingly'
      }
    ]
  }
];

const FontNode: React.FC<NodeProps> = React.memo(({ id, data }) => {
  const [currentFontIndex, setCurrentFontIndex] = useState(0);
  const [selectedFonts, setSelectedFonts] = useState<{ [category: string]: string }>({});
  const [previewText, setPreviewText] = useState(data.previewText || 'Beautiful Modern Design');
  const [rewardedCategories, setRewardedCategories] = useState<Set<string>>(new Set());
  const { celebrateCoinsWithMessage } = useCoins();

  // Load existing font selections from storage on mount
  useEffect(() => {
    const storedSelections = getUserFontSelections();
    const selectedFontNames: { [category: string]: string } = {};
    
    Object.entries(storedSelections).forEach(([category, selection]) => {
      selectedFontNames[category] = selection.fontName;
    });
    
    setSelectedFonts(selectedFontNames);
  }, []);

  // Find the category based on the data.category prop, defaulting to Sans Serif
  const categoryTitle = data.category || 'Sans Serif';
  const currentCategoryData = fontCategories.find(cat => cat.title === categoryTitle) || fontCategories[0];
  const currentFont = currentCategoryData.fonts[currentFontIndex];


  const toggleCurrentFont = () => {
    const newSelectedFonts = { ...selectedFonts };
    
    if (selectedFonts[currentCategoryData.title] === currentFont.name) {
      // Deselect if already selected
      delete newSelectedFonts[currentCategoryData.title];
      removeFontSelection(currentCategoryData.title);
    } else {
      // Select if not selected
      newSelectedFonts[currentCategoryData.title] = currentFont.name;
      
      // Save to session storage
      saveFontSelection(
        currentCategoryData.title,
        currentFont.name,
        currentFont.fontFamily,
        currentFont.personality,
        currentFont.description
      );
      
      // Award diamonds for Sans Serif or Serif selections (not Decorative)
      if ((currentCategoryData.title === 'Sans Serif' || currentCategoryData.title === 'Serif') 
          && !rewardedCategories.has(currentCategoryData.title)) {
        celebrateCoinsWithMessage(2, `Nice choice! +2 💎 for selecting a ${currentCategoryData.title} font`);
        setRewardedCategories(prev => new Set([...prev, currentCategoryData.title]));
      }
    }
    
    setSelectedFonts(newSelectedFonts);
    
    if (data.onFontSelect) {
      data.onFontSelect(id, newSelectedFonts);
    }
  };

  const isCurrentFontSelected = selectedFonts[currentCategoryData.title] === currentFont.name;
  const hasRequiredFont = selectedFonts['Sans Serif'] || selectedFonts['Serif'];

  useEffect(() => {
    if (data.previewText && data.previewText !== previewText) {
      setPreviewText(data.previewText);
    }
  }, [data.previewText]);

  return (
    <div 
      className="font-node flex flex-col px-6 py-5 text-gray-900 bg-gray-50 bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg border-t-8 border-t-gray-900 transition-all duration-300 ease-in-out"
      style={{
        width: '100%',
        height: '100%',
        minWidth: '700px',
        minHeight: '750px',
        maxHeight: '750px',
        overflow: 'hidden'
      }}
    >
      
      <div className="font-bold text-gray-900 text-xl mb-2">
        {currentCategoryData.title} Fonts
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        {currentCategoryData.title === 'Sans Serif' && 
          "Clean and modern, great for body text, tech companies, and professional websites"}
        {currentCategoryData.title === 'Serif' && 
          "Traditional and trustworthy, perfect for news, blogs, and content-heavy sites"}
        {currentCategoryData.title === 'Decorative' && 
          "Eye-catching and unique, ideal for headlines and branding (optional for most websites)"}
      </div>

      {/* Font Selection Layout */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Font List Sidebar */}
        <div className="w-48 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          {/* <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="font-medium text-gray-900 text-sm">
              {currentCategoryData.title} Fonts
            </div>
          </div> */}
          <div className="overflow-auto flex-1">
            {currentCategoryData.fonts.map((font, index) => {
              const isSelected = selectedFonts[currentCategoryData.title] === font.name;
              const isActive = currentFontIndex === index;
              
              return (
                <button
                  key={font.name}
                  onClick={() => setCurrentFontIndex(index)}
                  className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  } ${isSelected ? 'bg-green-50' : ''}`}
                >
                  <div 
                    className="font-medium text-gray-900 mb-1 text-base"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.name} {isSelected && '✓'}
                  </div>
                  <div 
                    className="text-xs text-gray-600"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.personality}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Preview Panel */}
        <div className="flex-1 bg-white rounded-lg p-6 border border-gray-200 overflow-auto">
          {/* Current Font Header */}
          <div className="mb-6">
            <div 
              className="text-2xl font-semibold text-gray-900 mb-2"
              style={{ fontFamily: currentFont.fontFamily }}
            >
              {currentFont.name}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {currentFont.description}
            </div>
          </div>

          {/* Font Preview Text */}
          <div className="mb-6">
            <div 
              className="text-xl mb-3 text-gray-900 break-words leading-relaxed"
              style={{ fontFamily: currentFont.fontFamily }}
            >
              {previewText}
            </div>
            <div 
              className="text-lg text-gray-600 mb-4"
              style={{ fontFamily: currentFont.fontFamily }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
            <div 
              className="text-sm text-gray-500"
              style={{ fontFamily: currentFont.fontFamily }}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 1234567890
            </div>
          </div>

          {/* Font Personality Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              {/* <LuInfo size={18} className="text-gray-500 mt-0.5 flex-shrink-0" /> */}
              <div>
                <div className="font-medium text-gray-900 mb-1">
                  {currentFont.personality}
                </div>
                <div className="text-sm text-gray-600">
                  {currentFont.description}
                </div>
              </div>
            </div>
          </div>

          {/* Selection Button */}
          <button
            onClick={toggleCurrentFont}
            className={`w-full py-3 rounded-md font-medium transition-all ${
              isCurrentFontSelected
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isCurrentFontSelected ? '✓ Selected' : 
              `Pick for your design${
                (currentCategoryData.title === 'Sans Serif' || currentCategoryData.title === 'Serif') 
                && !rewardedCategories.has(currentCategoryData.title) 
                  ? ' (+💎💎)' 
                  : ''
              }`
            }
          </button>
        </div>
      </div>


      {/* Validation Status */}
      {!hasRequiredFont && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-4">
          <div className="text-xs text-yellow-800">
            ⚠️ Please select at least one Sans Serif or Serif font for your main typography
          </div>
        </div>
      )}

      {/* Selected Fonts Summary */}
      {Object.keys(selectedFonts).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="text-xs text-green-800">
            <div className="font-medium mb-1">Selected Fonts:</div>
            {Object.entries(selectedFonts).map(([category, font]) => (
              <div key={category}>• {category}: {font}</div>
            ))}
          </div>
        </div>
      )}

      {/* Target handle on the left */}
      <Handle
        className="bg-gray-900 opacity-50"
        style={{
          width: '20px',
          height: '60px',
          borderRadius: '5px',
          borderWidth: '2px',
          borderColor: 'white',
          borderStyle: 'solid',
          marginLeft: '-10px',
        }}
        type="target"
        position={Position.Left}
        id="a"
      />
      
      {/* Source handle on the right */}
      <Handle
        className="bg-gray-900 opacity-50"
        style={{
          width: '20px',
          height: '60px',
          borderRadius: '5px',
          borderWidth: '2px',
          borderColor: 'white',
          borderStyle: 'solid',
          marginRight: '-5px',
        }}
        type="source"
        position={Position.Right}
        id="b"
        isConnectable={true}
      />
    </div>
  );
});

export default FontNode;