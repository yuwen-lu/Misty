import confetti from "canvas-confetti";

interface CelebrationOptions {
    message: string;
    amount?: number;
    showDiamonds?: boolean;
    duration?: number;
    colors?: string[];
}

export const celebrate = ({
    message,
    amount,
    showDiamonds = true,
    duration = 2000,
    colors = ["#FFD700", "#00FF00", "#0099FF", "#FF6B6B", "#9B59B6"],
}: CelebrationOptions) => {
    // Trigger confetti celebration
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
    const celebrationDiv = document.createElement("div");
    const diamondText = showDiamonds && amount ? `${amount} 💎` : "";

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
      font-size: 2rem;
      font-weight: bold;
      font-family: monospace;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      border: 4px solid #059669;
      z-index: 9999;
      animation: bounce 0.6s ease-out;
      text-align: center;
    ">
      ${diamondText ? `<div style="font-size: 2.5rem; ${message ? "margin-top: 10px;" : ""}">You earned ${diamondText}!</div>` : ""}
      ${message ? `<div>${message}</div>` : ""}
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

    // Remove the celebration text after specified duration
    setTimeout(() => {
        document.body.removeChild(celebrationDiv);
    }, duration);
};

// Specific celebration functions for common use cases
export const celebrateCoins = (amount: number) => {
    celebrate({
        message: "",
        amount,
        showDiamonds: true,
    });
};

export const celebrateCoinsWithMessage = (amount: number, message: string) => {
    celebrate({
        message,
        amount,
        showDiamonds: true,
    });
};

export const celebrateAchievement = (message: string) => {
    celebrate({
        message,
        showDiamonds: false,
        colors: ["#FFD700", "#FFA500", "#FF6347", "#FFE4B5", "#FFC0CB"],
    });
};

export const celebrateSuccess = (message: string) => {
    celebrate({
        message,
        showDiamonds: false,
        colors: ["#00FF00", "#32CD32", "#228B22", "#7CFC00", "#00FA9A"],
    });
};

// Function to show instructional popup before diamond celebration
export const showInstructionalPopup = (onConfirm: () => void) => {
    const popupDiv = document.createElement("div");
    
    popupDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
    ">
      <div style="
        background: white;
        color: #374151;
        padding: 32px;
        border-radius: 16px;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        border: 2px solid #f59e0b;
        max-width: 500px;
        margin: 20px;
        text-align: center;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-size: 2rem; margin-bottom: 16px;">🎨</div>
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 16px; color: #1f2937;">Design Inspection Guide</h2>
        <div style="font-size: 1rem; line-height: 1.6; margin-bottom: 24px; text-align: left;">
          <p style="margin-bottom: 12px;">When exploring this website, pay attention to:</p>
          <ul style="margin-left: 20px; margin-bottom: 16px;">
            <li style="margin-bottom: 8px;">• <strong>Typography:</strong> How many fonts are used? What styles?</li>
            <li style="margin-bottom: 8px;">• <strong>Color palette:</strong> Primary and accent colors</li>
            <li style="margin-bottom: 8px;">• <strong>Layout:</strong> Grid structure, spacing, alignment</li>
            <li style="margin-bottom: 8px;">• <strong>Visual hierarchy:</strong> What draws your attention first?</li>
            <li style="margin-bottom: 8px;">• <strong>Interactive elements:</strong> Buttons, forms, navigation</li>
          </ul>
          <p style="text-align: center; font-style: italic;">Come back to take notes on what you learned!</p>
        </div>
        <button id="confirmBtn" style="
          background: #f59e0b;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
          Got it
        </button>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;

    // Add click handler for the confirm button
    document.body.appendChild(popupDiv);
    
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(popupDiv);
            onConfirm();
        });
    }

    // Allow closing by clicking outside the popup
    popupDiv.addEventListener('click', (e) => {
        if (e.target === popupDiv) {
            document.body.removeChild(popupDiv);
            onConfirm();
        }
    });
};
