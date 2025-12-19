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

// Game Config
const config = {
    targetRTP: 0.70,
    goldReward: 500,
    diamondReward: 750,
    minBet: 10,
    maxBet: 500,
    betStep: 5
};

// Symbols
const symbols = {
    '😇': { type: 'gold', weight: 18, title: 'Melek Gücü' },
    '😈': { type: 'diamond', weight: 15, title: 'Şeytan Gücü' },
    '💰': { type: 'money', weight: 8, value: 20, title: '20₺' },
    '💵': { type: 'money', weight: 6, value: 50, title: '50₺' },
    '💸': { type: 'money', weight: 4, value: 100, title: '100₺' },
    '🏆': { type: 'money', weight: 2, value: 250, title: '250₺' },
    '⚡': { type: 'multiplier', weight: 5, value: 0.3, title: '0.3x' },
    '✨': { type: 'multiplier', weight: 4, value: 0.6, title: '0.6x' },
    '⭐': { type: 'multiplier', weight: 3, value: 1.2, title: '1.2x' },
    '🌟': { type: 'multiplier', weight: 2, value: 2.3, title: '2.3x' },
    '❌': { type: 'empty', weight: 33, title: 'Tekrar Dene' }
};

const totalWeight = Object.values(symbols).reduce((sum, s) => sum + s.weight, 0);

// DOM Elements
const els = {
    betButton: document.getElementById('bet-button'),
    betAmount: document.getElementById('bet-amount'),
    betInput: document.getElementById('bet-input'),
    resultCircle: document.getElementById('result-circle'),
    resultSymbol: document.getElementById('result-symbol'),
    panelText: document.getElementById('panel-text'),
    balance: document.getElementById('balance'),
    totalWin: document.getElementById('total-win'),
    highestWin: document.getElementById('highest-win'),
    spinCount: document.getElementById('spin-count'),
    flavorText: document.getElementById('flavor-text'),
    winPopup: document.getElementById('win-popup'),
    winIcon: document.getElementById('win-icon'),
    winMessage: document.getElementById('win-message'),
    winAmountBig: document.getElementById('win-amount-big'),
    continueBtn: document.getElementById('continue-btn')
};

// Init
function init() {
    updateDisplay();
    
    els.betButton.addEventListener('click', spin);
    document.getElementById('decrease').addEventListener('click', () => adjustBet(-config.betStep));
    document.getElementById('increase').addEventListener('click', () => adjustBet(config.betStep));
    els.betInput.addEventListener('change', validateBet);
    
    document.querySelectorAll('.quick-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.currentBet = parseInt(btn.dataset.bet);
            els.betInput.value = gameState.currentBet;
            updateDisplay();
            updateQuickBets();
        });
    });
    
    els.continueBtn.addEventListener('click', () => {
        els.winPopup.classList.remove('show');
    });
}

// Adjust Bet
function adjustBet(amount) {
    const newBet = gameState.currentBet + amount;
    if (newBet >= config.minBet && newBet <= config.maxBet && newBet <= gameState.balance) {
        gameState.currentBet = newBet;
        els.betInput.value = newBet;
        updateDisplay();
        updateQuickBets();
    }
}

// Validate Bet
function validateBet() {
    let val = parseInt(els.betInput.value) || config.minBet;
    val = Math.max(config.minBet, Math.min(val, config.maxBet, gameState.balance));
    gameState.currentBet = val;
    els.betInput.value = val;
    updateDisplay();
    updateQuickBets();
}

// Update Quick Bets
function updateQuickBets() {
    document.querySelectorAll('.quick-bet-btn').forEach(btn => {
        const amount = parseInt(btn.dataset.bet);
        btn.classList.toggle('active', amount === gameState.currentBet);
        btn.disabled = amount > gameState.balance;
    });
}

// Get Random Symbol
function getRandomSymbol() {
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (const [symbol, config] of Object.entries(symbols)) {
        cumulative += config.weight;
        if (rand < cumulative) return symbol;
    }
    
    return '❌';
}

// Update Display
function updateResultDisplay(symbol, text) {
    els.resultSymbol.textContent = symbol;
    els.panelText.textContent = text;
}

// Spin Animation
async function animateSpin(finalSymbol, duration = 2500) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        els.resultCircle.classList.add('spinning');
        
        let elapsed = 0;
        const interval = setInterval(() => {
            const randomSym = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            els.resultSymbol.textContent = randomSym;
            
            elapsed += 80;
            if (elapsed >= duration) {
                clearInterval(interval);
                els.resultCircle.classList.remove('spinning');
                els.resultSymbol.textContent = finalSymbol;
                resolve();
            }
        }, 80);
    });
}

// Main Spin
async function spin() {
    if (gameState.isSpinning) return;
    
    if (gameState.balance < gameState.currentBet) {
        updateResultDisplay('⚠️', 'Yetersiz Bakiye!');
        els.flavorText.textContent = 'Daha düşük bir bahis seçin.';
        return;
    }
    
    gameState.isSpinning = true;
    els.betButton.disabled = true;
    
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();
    
    updateResultDisplay('🎰', 'Çevriliyor...');
    els.flavorText.textContent = 'Çark dönüyor... Şansın yaver gitsin!';
    
    const result = getRandomSymbol();
    
    await animateSpin(result, 2500);
    
    const symbolConfig = symbols[result];
    updateResultDisplay(result, symbolConfig.title);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    await calculateWinnings(result);
    
    gameState.isSpinning = false;
    els.betButton.disabled = false;
    updateDisplay();
}

// Calculate Winnings
async function calculateWinnings(symbol) {
    let totalWin = 0;
    let hasSpecial = false;
    const symbolConfig = symbols[symbol];
    
    switch (symbolConfig.type) {
        case 'gold':
            gameState.goldSlots++;
            updateProgressSlots('gold');
            els.flavorText.textContent = 'Altın bulundu! Melek Gücü artıyor...';
            
            if (gameState.goldSlots >= 3) {
                totalWin += config.goldReward;
                hasSpecial = true;
                gameState.goldSlots = 0;
                resetProgressSlots('gold');
                els.flavorText.textContent = `🎊 MELEK GÜCÜ TAMAMLANDI! ${config.goldReward}₺ Kazandınız!`;
            }
            break;
            
        case 'diamond':
            gameState.diamondSlots++;
            updateProgressSlots('diamond');
            els.flavorText.textContent = 'Pırlanta bulundu! Şeytan Gücü artıyor...';
            
            if (gameState.diamondSlots >= 3) {
                totalWin += config.diamondReward;
                hasSpecial = true;
                gameState.diamondSlots = 0;
                resetProgressSlots('diamond');
                els.flavorText.textContent = `🔥 ŞEYTAN GÜCÜ TAMAMLANDI! ${config.diamondReward}₺ Kazandınız!`;
            }
            break;
            
        case 'money':
            totalWin += symbolConfig.value;
            els.flavorText.textContent = `💰 ${symbolConfig.value}₺ Kazandınız!`;
            break;
            
        case 'multiplier':
            totalWin += Math.floor(gameState.currentBet * symbolConfig.value);
            els.flavorText.textContent = `⚡ Çarpan ${symbolConfig.value}x! ${Math.floor(gameState.currentBet * symbolConfig.value)}₺`;
            break;
            
        case 'empty':
            els.flavorText.textContent = '❌ Bu sefer olmadı! Tekrar deneyin.';
            break;
    }
    
    if (totalWin > 0) {
        gameState.balance += totalWin;
        gameState.totalWin += totalWin;
        
        if (totalWin > gameState.highestWin) {
            gameState.highestWin = totalWin;
        }
        
        if (hasSpecial || totalWin >= gameState.currentBet * 2) {
            await new Promise(resolve => setTimeout(resolve, 800));
            showWinPopup(totalWin, hasSpecial, symbol);
        }
    }
    
    updateDisplay();
}

// Update Progress Slots
function updateProgressSlots(type) {
    const slots = document.querySelectorAll(`.power-box:${type === 'gold' ? 'first' : 'last'}-child .progress-dot`);
    const count = type === 'gold' ? gameState.goldSlots : gameState.diamondSlots;
    const icon = type === 'gold' ? '😇' : '😈';
    
    if (count > 0 && count <= 3) {
        const slot = slots[count - 1];
        slot.classList.remove('locked');
        slot.classList.add('filled');
        slot.textContent = icon;
    }
}

// Reset Progress Slots
function resetProgressSlots(type) {
    const slots = document.querySelectorAll(`.power-box:${type === 'gold' ? 'first' : 'last'}-child .progress-dot`);
    const defaultIcon = type === 'gold' ? '😇' : '😈';
    
    setTimeout(() => {
        slots.forEach((slot, i) => {
            slot.classList.remove('filled');
            if (i > 0) {
                slot.classList.add('locked');
                slot.textContent = '⚪';
            } else {
                slot.textContent = defaultIcon;
            }
        });
    }, 3000);
}

// Show Win Popup
function showWinPopup(amount, isSpecial, symbol) {
    els.winAmountBig.textContent = `${amount}₺`;
    
    if (isSpecial) {
        els.winIcon.textContent = symbol;
        els.winMessage.textContent = 'GÜÇ TAMAMLANDI!';
    } else if (amount >= gameState.currentBet * 5) {
        els.winIcon.textContent = '🎊';
        els.winMessage.textContent = 'BÜYÜK KAZANÇ!';
    } else {
        els.winIcon.textContent = '🎉';
        els.winMessage.textContent = 'KAZANDINIZ!';
    }
    
    els.winPopup.classList.add('show');
    confetti();
}

// Confetti
function confetti() {
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4FC3F7'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '-10px';
            particle.style.width = (8 + Math.random() * 8) + 'px';
            particle.style.height = (8 + Math.random() * 8) + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.animation = `fall ${2 + Math.random() * 2}s linear`;
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 4000);
        }, i * 20);
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
    els.balance.textContent = Math.floor(gameState.balance) + '₺';
    els.betAmount.textContent = gameState.currentBet + '₺';
    els.totalWin.textContent = Math.floor(gameState.totalWin) + '₺';
    els.highestWin.textContent = Math.floor(gameState.highestWin) + '₺';
    els.spinCount.textContent = gameState.spinCount;
    
    els.betButton.disabled = gameState.balance < gameState.currentBet || gameState.isSpinning;
    
    if (gameState.balance < config.minBet && !gameState.isSpinning) {
        els.flavorText.textContent = '💔 Bakiyeniz bitti! Oyun sona erdi.';
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
    
    els.betInput.value = 25;
    
    resetProgressSlots('gold');
    resetProgressSlots('diamond');
    
    updateDisplay();
    updateResultDisplay('😈', 'Demon Power');
    els.flavorText.textContent = 'Yeni oyun başladı! İyi şanslar!';
}

// Initialize
window.addEventListener('DOMContentLoaded', init);
