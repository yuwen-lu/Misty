import React, { useState, useEffect } from 'react';
import { useCoins } from '../contexts/CoinContext';
import { celebrate } from '../utils/celebration';

interface DesignFeedbackPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (feedback: { liked: string; disliked: string }) => void;
  websiteUrl?: string;
}

const DesignFeedbackPopup: React.FC<DesignFeedbackPopupProps> = ({
  isVisible,
  onClose,
  onSubmit,
  websiteUrl
}) => {
  const [liked, setLiked] = useState('');
  const [disliked, setDisliked] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addCoins } = useCoins();

  const celebrateFeedback = (amount: number) => {
    addCoins(amount);
    
    // Use the reusable celebration utility
    celebrate({
      message: 'Great feedback!',
      amount,
      showDiamonds: true
    });
  };

  const handleSubmit = async () => {
    if (!liked.trim() && !disliked.trim()) return;
    
    setIsSubmitting(true);
    
    // Award 2 gems for feedback with custom celebration
    celebrateFeedback(2);
    
    // Submit feedback
    onSubmit({ liked: liked.trim(), disliked: disliked.trim() });
    
    // Reset form
    setLiked('');
    setDisliked('');
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setLiked('');
    setDisliked('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-50 rounded-lg border-2 border-stone-400 border-opacity-30 shadow-lg border-t-8 border-t-yellow-700 p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-900">
            How did you like it?
          </h3>
          <button
            onClick={handleClose}
            className="text-yellow-700 hover:text-yellow-900 transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-yellow-800 mb-3">
            What did you think about this design? What did you learn?
          </p>
          {websiteUrl && (
            <p className="text-xs text-yellow-700 mb-3 break-all bg-yellow-50 p-2 rounded">
              {websiteUrl}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <textarea
              value={liked}
              onChange={(e) => setLiked(e.target.value)}
              placeholder="The color palette caught my eye, the layout was clean..."
              className="w-full p-3 bg-white bg-opacity-50 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-yellow-700 placeholder-yellow-700/50"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-yellow-700 bg-yellow-100 bg-opacity-50 rounded-md hover:bg-yellow-200 hover:bg-opacity-70 transition-colors font-semibold"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!liked.trim() && !disliked.trim())}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-semibold"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit & Get 2 💎</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignFeedbackPopup;