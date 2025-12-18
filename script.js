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
        title: 'Melek Gücü',
        subtitle: 'Altın Bulundu!',
        bgColor: '#87CEEB'
    },
    '😈': { 
        type: 'diamond', 
        weight: 15,
        title: 'Şeytan Gücü',
        subtitle: 'Pırlanta Bulundu!',
        bgColor: '#FF6B6B'
    },
    '💰': { 
        type: 'money', 
        weight: 8, 
        value: 20,
        title: '20₺ Kazandınız',
        subtitle: 'Para Ödülü',
        bgColor: '#FFD700'
    },
    '💵': { 
        type: 'money', 
        weight: 6, 
        value: 50,
        title: '50₺ Kazandınız',
        subtitle: 'İyi Kazanç!',
        bgColor: '#4CAF50'
    },
    '💸': { 
        type: 'money', 
        weight: 4, 
        value: 100,
        title: '100₺ Kazandınız',
        subtitle: 'Harika!',
        bgColor: '#2196F3'
    },
    '🏆': { 
        type: 'money', 
        weight: 2, 
        value: 250,
        title: '250₺ Kazandınız',
        subtitle: 'Büyük Ödül!',
        bgColor: '#FF9800'
    },
    '⚡': { 
        type: 'multiplier', 
        weight: 5, 
        value: 0.3,
        title: 'Çarpan 0.3x',
        subtitle: 'Mini Ödül',
        bgColor: '#9C27B0'
    },
    '✨': { 
        type: 'multiplier', 
        weight: 4, 
        value: 0.6,
        title: 'Çarpan 0.6x',
        subtitle: 'İyi!',
        bgColor: '#E91E63'
    },
    '⭐': { 
        type: 'multiplier', 
        weight: 3, 
        value: 1.2,
        title: 'Çarpan 1.2x',
        subtitle: 'Süper!',
        bgColor: '#FF5722'
    },
    '🌟': { 
        type: 'multiplier', 
        weight: 2, 
        value: 2.3,
        title: 'Çarpan 2.3x',
        subtitle: 'Muhteşem!',
        bgColor: '#FFC107'
    },
    '❌': { 
        type: 'empty', 
        weight: 33,
        title: 'Tekrar Dene',
        subtitle: 'Bu Sefer Olmadı',
        bgColor: '#757575'
    }
};

// Total weight
const totalWeight = Object.values(symbols).reduce((sum, symbol) => sum + symbol.weight, 0);

// DOM Elements
const elements = {
    balanceTop: document.getElementById('balance-top'),
    betInput: document.getElementById('bet-input'),
    currentBetDisplay: document.getElementById('current-bet-display'),
    spinButton: document.getElementById('spin-button'),
    resultCircle: document.getElementById('result-circle'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultSubtitle: document.getElementById('result-subtitle'),
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
    updateDisplay();
    setupEventListeners();
    updateQuickBets();
}

// Setup Event Listeners
function setupEventListeners() {
    elements.spinButton.addEventListener('click', spin);
    document.getElementById('decrease-bet').addEventListener('click', () => adjustBet(-config.betStep));
    document.getElementById('increase-bet').addEventListener('click', () => adjustBet(config.betStep));
    elements.betInput.addEventListener('input', handleBetInput);
    elements.betInput.addEventListener('change', validateBet);
    
    document.querySelectorAll('.quick-chip-mini').forEach(btn => {
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
function updateResultDisplay(icon, title, subtitle, bgColor) {
    elements.resultIcon.textContent = icon;
    elements.resultTitle.textContent = title;
    elements.resultSubtitle.textContent = subtitle;
    
    // Update circle background with gradient
    const lightColor = lightenColor(bgColor, 20);
    elements.resultCircle.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${lightColor} 100%)`;
}

// Lighten color helper
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
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
    document.querySelectorAll('.quick-chip-mini').forEach(btn => {
        const betAmount = parseInt(btn.dataset.bet);
        btn.classList.toggle('active', betAmount === gameState.currentBet);
        btn.disabled = betAmount > gameState.balance;
    });
}

// Get Random Symbol
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

// Animate Spin
async function animateSpin(duration = 2000) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        elements.resultCircle.classList.add('spinning');
        
        let elapsed = 0;
        const interval = setInterval(() => {
            const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            const symbolConfig = symbols[randomSymbol];
            
            elements.resultIcon.textContent = randomSymbol;
            elements.resultTitle.textContent = 'Dönüyor...';
            elements.resultSubtitle.textContent = '🎰';
            
            elapsed += 80;
            if (elapsed >= duration) {
                clearInterval(interval);
                elements.resultCircle.classList.remove('spinning');
                resolve();
            }
        }, 80);
    });
}

// Main Spin Function
async function spin() {
    if (gameState.isSpinning) return;
    
    if (gameState.balance < gameState.currentBet) {
        updateResultDisplay('⚠️', 'Yetersiz Bakiye', 'Daha Düşük Bahis Seç', '#f44336');
        return;
    }
    
    gameState.isSpinning = true;
    elements.spinButton.disabled = true;
    elements.spinButton.classList.add('spinning');
    
    // Deduct bet
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();
    
    // Animate spin
    await animateSpin(2000);
    
    // Get result
    const result = getRandomSymbol();
    const symbolConfig = symbols[result];
    
    // Show result
    updateResultDisplay(
        result,
        symbolConfig.title,
        symbolConfig.subtitle,
        symbolConfig.bgColor
    );
    
    // Calculate winnings
    await new Promise(resolve => setTimeout(resolve, 500));
    await calculateWinnings(result);
    
    gameState.isSpinning = false;
    elements.spinButton.disabled = false;
    elements.spinButton.classList.remove('spinning');
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
                updateResultDisplay('👑', 'MELEK GÜCÜ TAMAMLANDI!', `${config.goldReward}₺ Kazandınız!`, '#FFD700');
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
                updateResultDisplay('💎', 'ŞEYTAN GÜCÜ TAMAMLANDI!', `${config.diamondReward}₺ Kazandınız!`, '#9C27B0');
            }
            break;
            
        case 'money':
            totalWin += symbolConfig.value;
            break;
            
        case 'multiplier':
            totalWin += Math.floor(gameState.currentBet * symbolConfig.value);
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
    elements.balanceTop.textContent = Math.floor(gameState.balance) + '₺';
    elements.currentBetDisplay.textContent = gameState.currentBet + '₺';
    elements.totalWin.textContent = Math.floor(gameState.totalWin) + '₺';
    elements.highestWin.textContent = Math.floor(gameState.highestWin) + '₺';
    elements.spinCount.textContent = gameState.spinCount;
    
    elements.spinButton.disabled = gameState.balance < gameState.currentBet || gameState.isSpinning;
    
    if (gameState.balance < config.minBet && !gameState.isSpinning) {
        updateResultDisplay('💔', 'Bakiye Bitti', 'Oyun Sona Erdi', '#f44336');
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
    updateResultDisplay('😈', 'Çarkı Çevir', 'Şansını Dene!', '#FF6B6B');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

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
