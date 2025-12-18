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

// Symbol Configuration
const symbols = {
    '😇': { 
        type: 'gold', 
        weight: 18,
        title: 'Melek Gücü',
        color: '#87CEEB'
    },
    '😈': { 
        type: 'diamond', 
        weight: 15,
        title: 'Şeytan Gücü',
        color: '#FF6B6B'
    },
    '💰': { type: 'money', weight: 8, value: 20, title: '20₺', color: '#FFD700' },
    '💵': { type: 'money', weight: 6, value: 50, title: '50₺', color: '#4CAF50' },
    '💸': { type: 'money', weight: 4, value: 100, title: '100₺', color: '#2196F3' },
    '🏆': { type: 'money', weight: 2, value: 250, title: '250₺', color: '#FF9800' },
    '⚡': { type: 'multiplier', weight: 5, value: 0.3, title: '0.3x', color: '#9C27B0' },
    '✨': { type: 'multiplier', weight: 4, value: 0.6, title: '0.6x', color: '#E91E63' },
    '⭐': { type: 'multiplier', weight: 3, value: 1.2, title: '1.2x', color: '#FF5722' },
    '🌟': { type: 'multiplier', weight: 2, value: 2.3, title: '2.3x', color: '#FFC107' },
    '❌': { type: 'empty', weight: 33, title: 'Tekrar Dene', color: '#757575' }
};

const totalWeight = Object.values(symbols).reduce((sum, symbol) => sum + symbol.weight, 0);

// DOM Elements
const elements = {
    balanceTop: document.getElementById('balance-top'),
    betInput: document.getElementById('bet-input'),
    betValueDisplay: document.getElementById('bet-value-display'),
    betButtonMain: document.getElementById('bet-button-main'),
    resultIcon: document.getElementById('result-icon'),
    resultText: document.getElementById('result-text'),
    reelStrip: document.getElementById('reel-strip'),
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
    ]
};

// Initialize Game
function init() {
    createReelSegments();
    updateDisplay();
    setupEventListeners();
    updateQuickBets();
}

// Create Reel Segments
function createReelSegments() {
    const symbolKeys = Object.keys(symbols);
    // Create only 6 segments for clean vertical scrolling
    for (let i = 0; i < 6; i++) {
        const segment = document.createElement('div');
        segment.className = 'reel-segment';
        const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
        segment.textContent = randomSymbol;
        elements.reelStrip.appendChild(segment);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Main bet button as spin button
    elements.betButtonMain.addEventListener('click', spin);
    
    // Bet controls
    document.getElementById('decrease-bet').addEventListener('click', () => adjustBet(-config.betStep));
    document.getElementById('increase-bet').addEventListener('click', () => adjustBet(config.betStep));
    elements.betInput.addEventListener('input', handleBetInput);
    elements.betInput.addEventListener('change', validateBet);
    
    // Quick bet buttons
    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', () => {
            const betAmount = parseInt(btn.dataset.bet);
            gameState.currentBet = betAmount;
            elements.betInput.value = betAmount;
            updateDisplay();
            updateQuickBets();
        });
    });
    
    elements.closePopup.addEventListener('click', closeWinPopup);
}

// Update Result Display
function updateResultDisplay(icon, text) {
    elements.resultIcon.textContent = icon;
    elements.resultText.textContent = text;
}

// Animate Reel Spin (3D Cylinder)
async function animateReelSpin(finalResult, duration = 2500) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        elements.reelStrip.classList.add('spinning');
        
        let elapsed = 0;
        const interval = setInterval(() => {
            // Update all visible segments randomly during spin
            const segments = elements.reelStrip.querySelectorAll('.reel-segment');
            segments.forEach((segment, index) => {
                const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
                segment.textContent = randomSymbol;
            });
            
            // Update result display during spin
            const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            const symbolConfig = symbols[randomSymbol];
            updateResultDisplay(randomSymbol, 'Çevriliyor...');
            
            elapsed += 80;
            
            // Slow down at the end
            if (elapsed >= duration - 500) {
                clearInterval(interval);
                // Final positioning - show result in center (2nd segment)
                const finalSegments = elements.reelStrip.querySelectorAll('.reel-segment');
                finalSegments[0].textContent = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
                finalSegments[1].textContent = finalResult; // Center slot
                finalSegments[2].textContent = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
                
                setTimeout(() => {
                    elements.reelStrip.classList.remove('spinning');
                    resolve();
                }, 400);
            }
        }, 80);
    });
}

// Main Spin Function
async function spin() {
    if (gameState.isSpinning) return;
    
    if (gameState.balance < gameState.currentBet) {
        updateResultDisplay('⚠️', 'Yetersiz Bakiye!');
        return;
    }
    
    gameState.isSpinning = true;
    elements.betButtonMain.disabled = true;
    
    // Deduct bet
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();
    
    // Get result first
    const result = getRandomSymbol();
    const symbolConfig = symbols[result];
    
    updateResultDisplay('🎰', 'Çevriliyor...');
    
    // Animate reel with final result
    await animateReelSpin(result, 2500);
    
    // Show result
    updateResultDisplay(result, symbolConfig.title);
    
    // Calculate winnings
    await new Promise(resolve => setTimeout(resolve, 600));
    await calculateWinnings(result);
    
    gameState.isSpinning = false;
    elements.betButtonMain.disabled = false;
    updateDisplay();
}

// Calculate Winnings
async function calculateWinnings(symbol) {
    let totalWin = 0;
    let hasSpecialWin = false;
    const symbolConfig = symbols[symbol];
    
    switch (symbolConfig.type) {
        case 'gold':
            gameState.goldSlots++;
            updateProgressSlots('gold');
            
            if (gameState.goldSlots >= 3) {
                totalWin += config.goldReward;
                hasSpecialWin = true;
                gameState.goldSlots = 0;
                resetProgressSlots('gold');
                updateResultDisplay('👑', `${config.goldReward}₺ Kazandınız!`);
            }
            break;
            
        case 'diamond':
            gameState.diamondSlots++;
            updateProgressSlots('diamond');
            
            if (gameState.diamondSlots >= 3) {
                totalWin += config.diamondReward;
                hasSpecialWin = true;
                gameState.diamondSlots = 0;
                resetProgressSlots('diamond');
                updateResultDisplay('💎', `${config.diamondReward}₺ Kazandınız!`);
            }
            break;
            
        case 'money':
            totalWin += symbolConfig.value;
            updateResultDisplay(symbol, `${symbolConfig.value}₺ Kazandınız!`);
            break;
            
        case 'multiplier':
            totalWin += Math.floor(gameState.currentBet * symbolConfig.value);
            updateResultDisplay(symbol, `${Math.floor(gameState.currentBet * symbolConfig.value)}₺`);
            break;
    }
    
    if (totalWin > 0) {
        gameState.balance += totalWin;
        gameState.totalWin += totalWin;
        
        if (totalWin > gameState.highestWin) {
            gameState.highestWin = totalWin;
        }
        
        if (hasSpecialWin || totalWin >= gameState.currentBet * 2) {
            await new Promise(resolve => setTimeout(resolve, 800));
            showWinPopup(totalWin, hasSpecialWin, symbol);
        }
    }
    
    updateDisplay();
}

// Update Progress Slots
function updateProgressSlots(type) {
    const slots = type === 'gold' ? elements.goldSlots : elements.diamondSlots;
    const count = type === 'gold' ? gameState.goldSlots : gameState.diamondSlots;
    const icon = type === 'gold' ? '😇' : '😈';
    
    if (count > 0 && count <= 3) {
        const slot = slots[count - 1];
        slot.classList.remove('locked');
        slot.classList.add('filled');
        slot.querySelector('.mini-icon').textContent = icon;
    }
}

// Reset Progress Slots
function resetProgressSlots(type) {
    const slots = type === 'gold' ? elements.goldSlots : elements.diamondSlots;
    const defaultIcon = type === 'gold' ? '😇' : '😈';
    
    setTimeout(() => {
        slots.forEach((slot, index) => {
            slot.classList.remove('filled');
            if (index > 0) {
                slot.classList.add('locked');
                slot.querySelector('.mini-icon').textContent = '⚪';
            } else {
                slot.querySelector('.mini-icon').textContent = defaultIcon;
            }
        });
    }, 3000);
}

// Show Win Popup
function showWinPopup(amount, isSpecial, symbol) {
    elements.winAmount.textContent = `${amount}₺`;
    
    if (isSpecial) {
        elements.winIcon.textContent = symbol;
        elements.winMessage.textContent = 'GÜÇ TAMAMLANDI!';
    } else if (amount >= gameState.currentBet * 5) {
        elements.winIcon.textContent = '🎊';
        elements.winMessage.textContent = 'BÜYÜK KAZANÇ!';
    } else {
        elements.winIcon.textContent = '🎉';
        elements.winMessage.textContent = 'KAZANDINIZ!';
    }
    
    elements.winPopup.classList.add('show');
    confetti();
}

// Close Win Popup
function closeWinPopup() {
    elements.winPopup.classList.remove('show');
}

// Confetti Effect
function confetti() {
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4FC3F7', '#F9CA24'];
    const confettiCount = 60;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '-10px';
            particle.style.width = (8 + Math.random() * 8) + 'px';
            particle.style.height = (8 + Math.random() * 8) + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.animation = `fall ${2 + Math.random() * 2}s linear`;
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 4000);
        }, i * 20);
    }
}

// Update Display
function updateDisplay() {
    if (elements.balanceTop) {
        elements.balanceTop.textContent = Math.floor(gameState.balance) + '₺';
    }
    if (elements.betValueDisplay) {
        elements.betValueDisplay.textContent = gameState.currentBet + '₺';
    }
    if (elements.totalWin) {
        elements.totalWin.textContent = Math.floor(gameState.totalWin) + '₺';
    }
    if (elements.highestWin) {
        elements.highestWin.textContent = Math.floor(gameState.highestWin) + '₺';
    }
    if (elements.spinCount) {
        elements.spinCount.textContent = gameState.spinCount;
    }
    
    if (elements.betButtonMain) {
        elements.betButtonMain.disabled = gameState.balance < gameState.currentBet || gameState.isSpinning;
    }
    
    if (gameState.balance < config.minBet && !gameState.isSpinning) {
        updateResultDisplay('💔', 'Bakiye Bitti!');
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
    updateResultDisplay('😈', 'Demon Power');
}

// Add fall animation style
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

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
