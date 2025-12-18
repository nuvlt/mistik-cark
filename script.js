// Game State
const gameState = {
    balance: 1000,
    currentBet: 25,
    goldSlots: 0,
    diamondSlots: 0,
    totalWin: 0,
    highestWin: 0,
    spinCount: 0,
    isSpinning: false
};

// Game Configuration
const config = {
    targetRTP: 0.70,
    goldReward: 500,
    diamondReward: 750,
    minBet: 10,
    maxBet: 500,
    betStep: 5
};

// Symbol Configuration with RTP-balanced probabilities
const symbols = {
    '👑': { type: 'gold', weight: 18, payout: 0 },           // Altın (18%)
    '💎': { type: 'diamond', weight: 15, payout: 0 },        // Pırlanta (15%)
    '💰': { type: 'money', weight: 8, value: 20 },          // 20₺ (8%)
    '💵': { type: 'money', weight: 6, value: 50 },          // 50₺ (6%)
    '💸': { type: 'money', weight: 4, value: 100 },         // 100₺ (4%)
    '🏆': { type: 'money', weight: 2, value: 250 },         // 250₺ (2%)
    '✖️': { type: 'multiplier', weight: 5, value: 0.3 },    // 0.3x (5%)
    '✨': { type: 'multiplier', weight: 4, value: 0.6 },    // 0.6x (4%)
    '⭐': { type: 'multiplier', weight: 3, value: 1.2 },    // 1.2x (3%)
    '🌟': { type: 'multiplier', weight: 2, value: 2.3 },    // 2.3x (2%)
    '❌': { type: 'empty', weight: 33, payout: 0 }          // Boş (33%)
};

// Total weight for probability calculation
const totalWeight = Object.values(symbols).reduce((sum, symbol) => sum + symbol.weight, 0);

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    betInput: document.getElementById('bet-input'),
    currentBet: document.getElementById('current-bet'),
    spinButton: document.getElementById('spin-button'),
    resultText: document.getElementById('result-text'),
    totalWin: document.getElementById('total-win'),
    highestWin: document.getElementById('highest-win'),
    spinCount: document.getElementById('spin-count'),
    winPopup: document.getElementById('win-popup'),
    winIcon: document.getElementById('win-icon'),
    winMessage: document.getElementById('win-message'),
    winAmount: document.getElementById('win-amount'),
    closePopup: document.getElementById('close-popup'),
    goldSlots: [
        document.getElementById('gold-slot-1'),
        document.getElementById('gold-slot-2'),
        document.getElementById('gold-slot-3')
    ],
    diamondSlots: [
        document.getElementById('diamond-slot-1'),
        document.getElementById('diamond-slot-2'),
        document.getElementById('diamond-slot-3')
    ],
    reels: [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ]
};

// Initialize Game
function init() {
    updateDisplay();
    setupEventListeners();
    updateQuickBets();
}

// Setup Event Listeners
function setupEventListeners() {
    // Spin Button
    elements.spinButton.addEventListener('click', spin);

    // Bet Controls
    document.getElementById('decrease-bet').addEventListener('click', () => adjustBet(-config.betStep));
    document.getElementById('increase-bet').addEventListener('click', () => adjustBet(config.betStep));
    elements.betInput.addEventListener('input', handleBetInput);
    elements.betInput.addEventListener('change', validateBet);

    // Quick Bet Buttons
    document.querySelectorAll('.quick-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const betAmount = parseInt(btn.dataset.bet);
            gameState.currentBet = betAmount;
            elements.betInput.value = betAmount;
            updateDisplay();
            updateQuickBets();
        });
    });

    // Close Popup
    elements.closePopup.addEventListener('click', closeWinPopup);
}

// Adjust Bet
function adjustBet(amount) {
    const newBet = gameState.currentBet + amount;
    if (newBet >= config.minBet && newBet <= config.maxBet && newBet <= gameState.balance) {
        gameState.currentBet = newBet;
        elements.betInput.value = newBet;
        updateDisplay();
        updateQuickBets();
    }
}

// Handle Bet Input
function handleBetInput(e) {
    const value = parseInt(e.target.value) || config.minBet;
    gameState.currentBet = Math.max(config.minBet, Math.min(value, config.maxBet, gameState.balance));
    updateQuickBets();
}

// Validate Bet
function validateBet() {
    if (elements.betInput.value < config.minBet) {
        elements.betInput.value = config.minBet;
    } else if (elements.betInput.value > config.maxBet) {
        elements.betInput.value = config.maxBet;
    } else if (elements.betInput.value > gameState.balance) {
        elements.betInput.value = gameState.balance;
    }
    gameState.currentBet = parseInt(elements.betInput.value);
    updateDisplay();
    updateQuickBets();
}

// Update Quick Bet Buttons
function updateQuickBets() {
    document.querySelectorAll('.quick-bet-btn').forEach(btn => {
        const betAmount = parseInt(btn.dataset.bet);
        btn.classList.toggle('active', betAmount === gameState.currentBet);
        btn.disabled = betAmount > gameState.balance;
    });
}

// Get Random Symbol Based on Weighted Probability
function getRandomSymbol() {
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const [symbol, config] of Object.entries(symbols)) {
        cumulativeWeight += config.weight;
        if (random < cumulativeWeight) {
            return symbol;
        }
    }
    
    return '❌'; // Fallback
}

// Spin Animation
async function animateReel(reel, finalSymbol, duration) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        reel.classList.add('spinning');
        
        let elapsed = 0;
        const interval = setInterval(() => {
            const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            reel.querySelector('.symbol').textContent = randomSymbol;
            
            elapsed += 50;
            if (elapsed >= duration) {
                clearInterval(interval);
                reel.classList.remove('spinning');
                reel.querySelector('.symbol').textContent = finalSymbol;
                resolve();
            }
        }, 50);
    });
}

// Main Spin Function
async function spin() {
    if (gameState.isSpinning) return;
    
    // Check balance
    if (gameState.balance < gameState.currentBet) {
        showResult('Yetersiz bakiye! 😞', 'error');
        return;
    }
    
    gameState.isSpinning = true;
    elements.spinButton.disabled = true;
    elements.spinButton.classList.add('spinning');
    
    // Deduct bet
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();
    
    showResult('Döndürülüyor... 🎰', 'spinning');
    
    // Get random symbols
    const result = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol()
    ];
    
    // Animate reels
    await Promise.all([
        animateReel(elements.reels[0], result[0], 1000),
        animateReel(elements.reels[1], result[1], 1500),
        animateReel(elements.reels[2], result[2], 2000)
    ]);
    
    // Calculate winnings
    await calculateWinnings(result);
    
    gameState.isSpinning = false;
    elements.spinButton.disabled = false;
    elements.spinButton.classList.remove('spinning');
    updateDisplay();
}

// Calculate Winnings
async function calculateWinnings(result) {
    let totalWin = 0;
    let winMessages = [];
    let hasSpecialWin = false;
    
    // Check each symbol
    for (const symbol of result) {
        const symbolConfig = symbols[symbol];
        
        switch (symbolConfig.type) {
            case 'gold':
                gameState.goldSlots++;
                updateProgressSlots('gold');
                winMessages.push('Altın bulundu! 👑');
                
                if (gameState.goldSlots >= 3) {
                    totalWin += config.goldReward;
                    winMessages.push(`🎉 ALTIN HAZİNE KAZANILDI! ${config.goldReward}₺`);
                    gameState.goldSlots = 0;
                    resetProgressSlots('gold');
                    hasSpecialWin = true;
                }
                break;
                
            case 'diamond':
                gameState.diamondSlots++;
                updateProgressSlots('diamond');
                winMessages.push('Pırlanta bulundu! 💎');
                
                if (gameState.diamondSlots >= 3) {
                    totalWin += config.diamondReward;
                    winMessages.push(`🎉 PIRLANTA HAZİNE KAZANILDI! ${config.diamondReward}₺`);
                    gameState.diamondSlots = 0;
                    resetProgressSlots('diamond');
                    hasSpecialWin = true;
                }
                break;
                
            case 'money':
                const moneyWin = symbolConfig.value;
                totalWin += moneyWin;
                winMessages.push(`Para kazandınız: ${moneyWin}₺ 💵`);
                break;
                
            case 'multiplier':
                const multiplierWin = Math.floor(gameState.currentBet * symbolConfig.value);
                totalWin += multiplierWin;
                winMessages.push(`Çarpan: ${symbolConfig.value}x = ${multiplierWin}₺ ⭐`);
                break;
                
            case 'empty':
                // No win
                break;
        }
    }
    
    // Update balance and stats
    if (totalWin > 0) {
        gameState.balance += totalWin;
        gameState.totalWin += totalWin;
        
        if (totalWin > gameState.highestWin) {
            gameState.highestWin = totalWin;
        }
        
        // Show win popup for significant wins
        if (hasSpecialWin || totalWin >= gameState.currentBet * 2) {
            showWinPopup(totalWin, hasSpecialWin);
        } else {
            showResult(winMessages.join(' | '), 'win');
        }
    } else {
        showResult('Tekrar deneyin! 🎲', 'loss');
    }
    
    updateDisplay();
}

// Update Progress Slots
function updateProgressSlots(type) {
    const slots = type === 'gold' ? elements.goldSlots : elements.diamondSlots;
    const count = type === 'gold' ? gameState.goldSlots : gameState.diamondSlots;
    const icon = type === 'gold' ? '👑' : '💎';
    
    if (count > 0 && count <= 3) {
        const slot = slots[count - 1];
        slot.classList.add('filled', `${type}-slot`);
        slot.querySelector('.slot-icon').textContent = icon;
        slot.querySelector('.slot-icon').style.filter = 'none';
        slot.querySelector('.slot-icon').style.opacity = '1';
    }
}

// Reset Progress Slots
function resetProgressSlots(type) {
    const slots = type === 'gold' ? elements.goldSlots : elements.diamondSlots;
    
    setTimeout(() => {
        slots.forEach(slot => {
            slot.classList.remove('filled');
            slot.querySelector('.slot-icon').textContent = '🔒';
            slot.querySelector('.slot-icon').style.filter = 'grayscale(100%)';
            slot.querySelector('.slot-icon').style.opacity = '0.5';
        });
    }, 2000);
}

// Show Result Message
function showResult(message, type) {
    elements.resultText.textContent = message;
    
    // Color based on type
    const colors = {
        win: '#4CAF50',
        loss: '#f44336',
        spinning: '#ffd700',
        error: '#ff9800'
    };
    
    elements.resultText.style.color = colors[type] || '#ffd700';
}

// Show Win Popup
function showWinPopup(amount, isSpecial) {
    elements.winAmount.textContent = `${amount}₺`;
    
    if (isSpecial) {
        elements.winIcon.textContent = '🏆';
        elements.winMessage.textContent = 'HAZİNE KAZANILDI!';
    } else if (amount >= gameState.currentBet * 5) {
        elements.winIcon.textContent = '🎊';
        elements.winMessage.textContent = 'BÜYÜK KAZANÇ!';
    } else {
        elements.winIcon.textContent = '🎉';
        elements.winMessage.textContent = 'KAZANDINIZ!';
    }
    
    elements.winPopup.classList.add('show');
    
    // Play celebration animation
    confetti();
}

// Close Win Popup
function closeWinPopup() {
    elements.winPopup.classList.remove('show');
}

// Simple Confetti Effect
function confetti() {
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `fall ${2 + Math.random() * 2}s linear`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// Add fall animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Update Display
function updateDisplay() {
    elements.balance.textContent = gameState.balance.toFixed(2) + '₺';
    elements.currentBet.textContent = gameState.currentBet + '₺';
    elements.totalWin.textContent = gameState.totalWin.toFixed(2) + '₺';
    elements.highestWin.textContent = gameState.highestWin.toFixed(2) + '₺';
    elements.spinCount.textContent = gameState.spinCount;
    
    // Update button state
    elements.spinButton.disabled = gameState.balance < gameState.currentBet || gameState.isSpinning;
    
    // Check if game over
    if (gameState.balance < config.minBet && !gameState.isSpinning) {
        showResult('Oyun Bitti! Bakiye yetersiz. 😢', 'error');
        setTimeout(() => {
            if (confirm('Bakiyeniz bitti! Yeniden başlamak ister misiniz?')) {
                resetGame();
            }
        }, 1000);
    }
}

// Reset Game
function resetGame() {
    gameState.balance = 1000;
    gameState.currentBet = 25;
    gameState.goldSlots = 0;
    gameState.diamondSlots = 0;
    gameState.totalWin = 0;
    gameState.highestWin = 0;
    gameState.spinCount = 0;
    
    elements.betInput.value = 25;
    
    resetProgressSlots('gold');
    resetProgressSlots('diamond');
    
    updateDisplay();
    showResult('Yeni oyun başladı! İyi şanslar! 🍀', 'win');
}

// Calculate Actual RTP (for monitoring)
function calculateActualRTP() {
    if (gameState.spinCount === 0) return 0;
    const totalWagered = gameState.spinCount * gameState.currentBet;
    return (gameState.totalWin / totalWagered) * 100;
}

// Log RTP every 10 spins (for development)
setInterval(() => {
    if (gameState.spinCount > 0 && gameState.spinCount % 10 === 0) {
        console.log(`Spin Count: ${gameState.spinCount}`);
        console.log(`Actual RTP: ${calculateActualRTP().toFixed(2)}%`);
        console.log(`Target RTP: ${config.targetRTP * 100}%`);
    }
}, 1000);

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Prevent reload warning
window.addEventListener('beforeunload', (e) => {
    if (gameState.spinCount > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});
