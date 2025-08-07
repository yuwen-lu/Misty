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
      z-index: 50;
      padding: 16px;
    ">
      <div style="
        background: #fffbeb;
        border-radius: 8px;
        border: 2px solid rgba(120, 113, 108, 0.3);
        border-top: 8px solid #b45309;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 24px;
        max-width: 448px;
        width: 100%;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.125rem; font-weight: 600; color: #78350f; margin: 0;">
            🎨 Design Inspection Guide
          </h3>
          <button id="closeBtn" style="
            color: #b45309;
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s;
          " onmouseover="this.style.color='#78350f'" onmouseout="this.style.color='#b45309'">
            ✕
          </button>
        </div>
        
        <div style="margin-bottom: 16px;">
          <p style="font-size: 0.875rem; color: #92400e; margin-bottom: 12px;">
            When exploring this website, pay attention to:
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <ul style="color: #92400e; font-size: 0.875rem; line-height: 1.5; margin: 0; padding-left: 16px;">
            <li style="margin-bottom: 8px;"><strong>Typography:</strong> How many fonts are used? What styles?</li>
            <li style="margin-bottom: 8px;"><strong>Color palette:</strong> Primary and accent colors</li>
            <li style="margin-bottom: 8px;"><strong>Visual hierarchy:</strong> What draws your attention first?</li>
            <li style="margin-bottom: 8px;"><strong>Interactive elements:</strong> Buttons, forms, navigation</li>
          </ul>
          <p style="font-size: 0.875rem; color: #92400e; margin-top: 16px; font-style: italic; text-align: center;">
            Come back to take notes on what you learned!
          </p>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="confirmBtn" style="
            padding: 8px 16px;
            background: #d97706;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 0.875rem;
          " onmouseover="this.style.background='#b45309'" onmouseout="this.style.background='#d97706'">
            <span>Let's inspect!</span>
          </button>
        </div>
      </div>
    </div>
  `;

    // Add click handlers
    document.body.appendChild(popupDiv);
    
    const confirmBtn = document.getElementById('confirmBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(popupDiv);
            onConfirm();
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
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
