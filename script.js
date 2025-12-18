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

// Symbol Configuration with Display Info
const symbols = {
    '😇': { 
        type: 'gold', 
        weight: 18, 
        payout: 0,
        title: 'Angel Power',
        bgClass: 'angel-bg'
    },
    '😈': { 
        type: 'diamond', 
        weight: 15, 
        payout: 0,
        title: 'Demon Power',
        bgClass: 'demon-bg'
    },
    '💰': { type: 'money', weight: 8, value: 20, title: 'Coins 20₺' },
    '💵': { type: 'money', weight: 6, value: 50, title: 'Cash 50₺' },
    '💸': { type: 'money', weight: 4, value: 100, title: 'Money 100₺' },
    '🏆': { type: 'money', weight: 2, value: 250, title: 'Trophy 250₺' },
    '⚡': { type: 'multiplier', weight: 5, value: 0.3, title: 'Zap 0.3x' },
    '✨': { type: 'multiplier', weight: 4, value: 0.6, title: 'Sparkle 0.6x' },
    '⭐': { type: 'multiplier', weight: 3, value: 1.2, title: 'Star 1.2x' },
    '🌟': { type: 'multiplier', weight: 2, value: 2.3, title: 'Shining 2.3x' },
    '❌': { type: 'empty', weight: 33, payout: 0, title: 'Try Again' }
};

// Total weight for probability calculation
const totalWeight = Object.values(symbols).reduce((sum, symbol) => sum + symbol.weight, 0);

// Flavor texts for variety
const flavorTexts = [
    "You discover buildings which must be demonic tombs. The gargantuan structures deeply humble you.",
    "Ancient powers stir in the shadows. Your fate hangs in the balance.",
    "The mystical wheel spins, weaving threads of destiny and fortune.",
    "Celestial beings watch over your journey through this mythical realm.",
    "The clash between light and darkness shapes your fortune today."
];

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    betInput: document.getElementById('bet-input'),
    currentBet: document.getElementById('current-bet'),
    spinButton: document.getElementById('spin-button'),
    mainIcon: document.getElementById('main-icon'),
    mainTitle: document.getElementById('main-title'),
    flavorMessage: document.getElementById('flavor-message'),
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
    reelTrack: document.getElementById('reel-track')
};

// Initialize Game
function init() {
    updateDisplay();
    setupEventListeners();
    updateQuickBets();
    setRandomFlavorText();
    
    // Set initial display
    updateMainDisplay('😈', 'Demon Power', 'demon-bg');
}

// Setup Event Listeners
function setupEventListeners() {
    elements.spinButton.addEventListener('click', spin);
    document.getElementById('decrease-bet').addEventListener('click', () => adjustBet(-config.betStep));
    document.getElementById('increase-bet').addEventListener('click', () => adjustBet(config.betStep));
    elements.betInput.addEventListener('input', handleBetInput);
    elements.betInput.addEventListener('change', validateBet);
    
    document.querySelectorAll('.quick-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const betAmount = parseInt(btn.dataset.bet);
            gameState.currentBet = betAmount;
            elements.betInput.value = betAmount;
            updateDisplay();
            updateQuickBets();
        });
    });
    
    elements.closePopup.addEventListener('click', closeWinPopup);
    
    // Arrow buttons (cosmetic)
    document.querySelectorAll('.arrow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = '', 100);
        });
    });
}

// Update Main Display
function updateMainDisplay(icon, title, bgClass) {
    const avatarLarge = document.querySelector('.power-avatar-large');
    elements.mainIcon.textContent = icon;
    elements.mainTitle.textContent = title;
    
    // Update background class
    avatarLarge.className = 'power-avatar-large ' + bgClass;
}

// Set Random Flavor Text
function setRandomFlavorText() {
    const randomText = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];
    elements.flavorMessage.textContent = randomText;
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
        elements.betInput.value = Math.min(gameState.balance, config.maxBet);
    }
    gameState.currentBet = parseInt(elements.betInput.value);
    updateDisplay();
    updateQuickBets();
}

// Update Quick Bet Buttons
function updateQuickBets() {
    document.querySelectorAll('.quick-chip').forEach(btn => {
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
    
    return '❌';
}

// Animate Reel
async function animateReel(finalSymbol, duration = 2000) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        elements.reelTrack.classList.add('spinning');
        
        let elapsed = 0;
        const interval = setInterval(() => {
            const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            const symbolConfig = symbols[randomSymbol];
            
            // Update main display during spin
            updateMainDisplay(
                randomSymbol, 
                symbolConfig.title || 'Spinning...', 
                symbolConfig.bgClass || 'demon-bg'
            );
            
            elapsed += 100;
            if (elapsed >= duration) {
                clearInterval(interval);
                elements.reelTrack.classList.remove('spinning');
                
                // Show final result
                const finalConfig = symbols[finalSymbol];
                updateMainDisplay(
                    finalSymbol,
                    finalConfig.title || 'Result',
                    finalConfig.bgClass || 'demon-bg'
                );
                
                resolve();
            }
        }, 100);
    });
}

// Main Spin Function
async function spin() {
    if (gameState.isSpinning) return;
    
    if (gameState.balance < gameState.currentBet) {
        elements.flavorMessage.textContent = '⚠️ Yetersiz bakiye! Daha düşük bir bahis seçin.';
        return;
    }
    
    gameState.isSpinning = true;
    elements.spinButton.disabled = true;
    elements.spinButton.classList.add('spinning');
    
    // Deduct bet
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();
    
    elements.flavorMessage.textContent = '🎰 Çark dönüyor... Şansın yaver gitsin!';
    
    // Get random result
    const result = getRandomSymbol();
    
    // Animate reel
    await animateReel(result, 2000);
    
    // Calculate winnings
    await calculateWinnings(result);
    
    gameState.isSpinning = false;
    elements.spinButton.disabled = false;
    elements.spinButton.classList.remove('spinning');
    updateDisplay();
    setRandomFlavorText();
}

// Calculate Winnings
async function calculateWinnings(symbol) {
    let totalWin = 0;
    let winMessage = '';
    let hasSpecialWin = false;
    
    const symbolConfig = symbols[symbol];
    
    switch (symbolConfig.type) {
        case 'gold':
            gameState.goldSlots++;
            updateProgressSlots('gold');
            winMessage = '👑 Altın bulundu! Angel Power artıyor...';
            
            if (gameState.goldSlots >= 3) {
                totalWin += config.goldReward;
                winMessage = `🎊 ANGEL POWER TAMAMLANDI! ${config.goldReward}₺ Kazandınız!`;
                gameState.goldSlots = 0;
                resetProgressSlots('gold');
                hasSpecialWin = true;
            }
            break;
            
        case 'diamond':
            gameState.diamondSlots++;
            updateProgressSlots('diamond');
            winMessage = '💎 Pırlanta bulundu! Demon Power artıyor...';
            
            if (gameState.diamondSlots >= 3) {
                totalWin += config.diamondReward;
                winMessage = `🔥 DEMON POWER TAMAMLANDI! ${config.diamondReward}₺ Kazandınız!`;
                gameState.diamondSlots = 0;
                resetProgressSlots('diamond');
                hasSpecialWin = true;
            }
            break;
            
        case 'money':
            totalWin += symbolConfig.value;
            winMessage = `💰 ${symbolConfig.value}₺ Kazandınız!`;
            break;
            
        case 'multiplier':
            const multiplierWin = Math.floor(gameState.currentBet * symbolConfig.value);
            totalWin += multiplierWin;
            winMessage = `⚡ Çarpan ${symbolConfig.value}x! ${multiplierWin}₺ Kazandınız!`;
            break;
            
        case 'empty':
            winMessage = '❌ Bu sefer olmadı! Tekrar deneyin.';
            break;
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
            await new Promise(resolve => setTimeout(resolve, 500));
            showWinPopup(totalWin, hasSpecialWin, symbol);
        }
    }
    
    elements.flavorMessage.textContent = winMessage;
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
        elements.winMessage.textContent = 'POWER COMPLETED!';
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
    elements.balance.textContent = Math.floor(gameState.balance) + '₺';
    elements.currentBet.textContent = gameState.currentBet + '₺';
    elements.totalWin.textContent = Math.floor(gameState.totalWin) + '₺';
    elements.highestWin.textContent = Math.floor(gameState.highestWin) + '₺';
    elements.spinCount.textContent = gameState.spinCount;
    
    elements.spinButton.disabled = gameState.balance < gameState.currentBet || gameState.isSpinning;
    
    if (gameState.balance < config.minBet && !gameState.isSpinning) {
        elements.flavorMessage.textContent = '💔 Bakiyeniz bitti! Oyun sona erdi.';
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
    setRandomFlavorText();
    updateMainDisplay('😈', 'Demon Power', 'demon-bg');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
