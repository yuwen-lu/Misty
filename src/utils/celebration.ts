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
