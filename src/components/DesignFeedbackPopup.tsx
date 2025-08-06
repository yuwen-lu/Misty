import React, { useState, useEffect } from 'react';
import { useCoins } from '../contexts/CoinContext';
import confetti from 'canvas-confetti';

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

    // Show celebration text without "Website opening..."
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
            Document your learnings
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