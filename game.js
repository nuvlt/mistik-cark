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

// Config
const config = {
    goldReward: 500,
    diamondReward: 750,
    minBet: 10,
    maxBet: 500
};

// Symbols
const symbols = {
    '😇': { type: 'gold', weight: 18, title: 'Melek Gücü!' },
    '😈': { type: 'diamond', weight: 15, title: 'Şeytan Gücü!' },
    '💰': { type: 'money', weight: 8, value: 20, title: '20₺ Kazandınız!' },
    '💵': { type: 'money', weight: 6, value: 50, title: '50₺ Kazandınız!' },
    '💸': { type: 'money', weight: 4, value: 100, title: '100₺ Kazandınız!' },
    '🏆': { type: 'money', weight: 2, value: 250, title: '250₺ Kazandınız!' },
    '⚡': { type: 'multiplier', weight: 5, value: 0.3, title: 'Çarpan 0.3x' },
    '✨': { type: 'multiplier', weight: 4, value: 0.6, title: 'Çarpan 0.6x' },
    '⭐': { type: 'multiplier', weight: 3, value: 1.2, title: 'Çarpan 1.2x' },
    '🌟': { type: 'multiplier', weight: 2, value: 2.3, title: 'Çarpan 2.3x' },
    '❌': { type: 'empty', weight: 33, title: 'Tekrar Dene!' }
};

const totalWeight = Object.values(symbols).reduce((sum, s) => sum + s.weight, 0);

// DOM Elements
const els = {
    spinButton: document.getElementById('spin-button'),
    betDisplay: document.getElementById('bet-display'),
    betInput: document.getElementById('bet-input'),
    resultCircle: document.getElementById('result-circle'),
    resultSymbol: document.getElementById('result-symbol'),
    resultText: document.getElementById('result-text'),
    balance: document.getElementById('balance'),
    totalWin: document.getElementById('total-win'),
    highestWin: document.getElementById('highest-win'),
    spinCount: document.getElementById('spin-count'),
    flavorText: document.getElementById('flavor-text'),
    winPopup: document.getElementById('win-popup'),
    winIcon: document.getElementById('win-icon'),
    winMessage: document.getElementById('win-message'),
    winAmount: document.getElementById('win-amount'),
    continueBtn: document.getElementById('continue-btn')
};

// Init
function init() {
    updateDisplay();
    
    els.spinButton.addEventListener('click', spin);
    document.getElementById('decrease-bet').addEventListener('click', () => adjustBet(-5));
    document.getElementById('increase-bet').addEventListener('click', () => adjustBet(5));
    els.betInput.addEventListener('change', validateBet);
    
    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.currentBet = parseInt(btn.dataset.bet);
            els.betInput.value = gameState.currentBet;
            updateDisplay();
            updateQuickBets();
        });
    });
    
    els.continueBtn.addEventListener('click', () => {
        els.winPopup.classList.add('hidden');
        els.winPopup.classList.remove('flex');
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
    document.querySelectorAll('.quick-bet').forEach(btn => {
        const amount = parseInt(btn.dataset.bet);
        if (amount === gameState.currentBet) {
            btn.classList.add('bg-primary', 'border-primary-dark', 'active-bet');
            btn.classList.remove('bg-panel-bg-light', 'dark:bg-panel-bg-dark', 'border-[#5D4037]');
        } else {
            btn.classList.remove('bg-primary', 'border-primary-dark', 'active-bet');
            btn.classList.add('bg-panel-bg-light', 'dark:bg-panel-bg-dark', 'border-[#5D4037]');
        }
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
function updateResultDisplay(symbol, text, bgColor = '#EF4444') {
    els.resultSymbol.textContent = symbol;
    els.resultText.textContent = text;
    els.resultCircle.style.backgroundColor = bgColor;
}

// Spin Animation
async function animateSpin(finalSymbol, duration = 2500) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        let elapsed = 0;
        
        // Add spinning class
        els.resultCircle.style.animation = 'spin 0.5s linear infinite';
        
        const interval = setInterval(() => {
            const randomSym = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
            els.resultSymbol.textContent = randomSym;
            
            elapsed += 80;
            if (elapsed >= duration) {
                clearInterval(interval);
                els.resultCircle.style.animation = '';
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
        updateResultDisplay('⚠️', 'Yetersiz Bakiye!', '#DC2626');
        els.flavorText.textContent = 'Daha düşük bir bahis seçin veya bakiye ekleyin.';
        return;
    }
    
    gameState.isSpinning = true;
    els.spinButton.disabled = true;
    els.spinButton.style.opacity = '0.5';
    
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();
    
    updateResultDisplay('🎰', 'Çevriliyor...', '#A855F7');
    els.flavorText.textContent = 'Çark dönüyor... Şansınız yaver gitsin!';
    
    const result = getRandomSymbol();
    
    await animateSpin(result, 2500);
    
    const symbolConfig = symbols[result];
    const bgColors = {
        'gold': '#67E8F9',
        'diamond': '#F472B6',
        'money': '#10B981',
        'multiplier': '#F59E0B',
        'empty': '#EF4444'
    };
    updateResultDisplay(result, symbolConfig.title, bgColors[symbolConfig.type]);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    await calculateWinnings(result);
    
    gameState.isSpinning = false;
    els.spinButton.disabled = false;
    els.spinButton.style.opacity = '1';
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
            els.flavorText.textContent = '😇 Melek Gücü arttı! Devam edin...';
            
            if (gameState.goldSlots >= 3) {
                totalWin += config.goldReward;
                hasSpecial = true;
                gameState.goldSlots = 0;
                resetProgressSlots('gold');
                els.flavorText.textContent = `✨ MELEK GÜCÜ TAMAMLANDI! ${config.goldReward}₺ kazandınız!`;
            }
            break;
            
        case 'diamond':
            gameState.diamondSlots++;
            updateProgressSlots('diamond');
            els.flavorText.textContent = '😈 Şeytan Gücü arttı! Devam edin...';
            
            if (gameState.diamondSlots >= 3) {
                totalWin += config.diamondReward;
                hasSpecial = true;
                gameState.diamondSlots = 0;
                resetProgressSlots('diamond');
                els.flavorText.textContent = `🔥 ŞEYTAN GÜCÜ TAMAMLANDI! ${config.diamondReward}₺ kazandınız!`;
            }
            break;
            
        case 'money':
            totalWin += symbolConfig.value;
            els.flavorText.textContent = `💰 ${symbolConfig.value}₺ kazandınız!`;
            break;
            
        case 'multiplier':
            totalWin += Math.floor(gameState.currentBet * symbolConfig.value);
            els.flavorText.textContent = `⚡ Çarpan ${symbolConfig.value}x = ${Math.floor(gameState.currentBet * symbolConfig.value)}₺`;
            break;
            
        case 'empty':
            els.flavorText.textContent = '❌ Bu sefer olmadı! Şansınızı tekrar deneyin.';
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
    const container = type === 'gold' ? document.getElementById('gold-progress') : document.getElementById('diamond-progress');
    const slots = container.querySelectorAll(`.${type}-slot`);
    const count = type === 'gold' ? gameState.goldSlots : gameState.diamondSlots;
    const icon = type === 'gold' ? '😇' : '😈';
    const bgClass = type === 'gold' ? 'bg-accent-angel' : 'bg-accent-demon';
    
    if (count > 0 && count <= 3) {
        const slot = slots[count - 1];
        slot.classList.add(bgClass, 'border-white', 'filled');
        slot.classList.remove('bg-[#4E342E]', 'border-[#3E2723]');
        slot.innerHTML = `<span class="text-xs">${icon}</span>`;
    }
}

// Reset Progress Slots
function resetProgressSlots(type) {
    const container = type === 'gold' ? document.getElementById('gold-progress') : document.getElementById('diamond-progress');
    const slots = container.querySelectorAll(`.${type}-slot`);
    const icon = type === 'gold' ? '😇' : '😈';
    const bgClass = type === 'gold' ? 'bg-accent-angel' : 'bg-accent-demon';
    
    setTimeout(() => {
        slots.forEach((slot, i) => {
            slot.classList.remove(bgClass, 'border-white', 'filled');
            slot.classList.add('bg-[#4E342E]', 'border-[#3E2723]');
            if (i === 0) {
                slot.innerHTML = `<span class="text-xs">${icon}</span>`;
                slot.classList.add(bgClass, 'border-white', 'filled');
                slot.classList.remove('bg-[#4E342E]', 'border-[#3E2723]');
            } else {
                slot.innerHTML = '';
            }
        });
    }, 3000);
}

// Show Win Popup
function showWinPopup(amount, isSpecial, symbol) {
    els.winAmount.textContent = `${amount}₺`;
    
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
    
    els.winPopup.classList.remove('hidden');
    els.winPopup.classList.add('flex');
    confetti();
}

// Confetti
function confetti() {
    const colors = ['#fbbf24', '#d97706', '#67E8F9', '#F472B6'];
    
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

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg) scale(1.05); }
        to { transform: rotate(360deg) scale(1.05); }
    }
`;
document.head.appendChild(style);

// Update Display
function updateDisplay() {
    els.balance.textContent = Math.floor(gameState.balance) + '₺';
    els.betDisplay.textContent = gameState.currentBet + '₺';
    els.totalWin.textContent = Math.floor(gameState.totalWin) + '₺';
    els.highestWin.textContent = Math.floor(gameState.highestWin) + '₺';
    els.spinCount.textContent = gameState.spinCount;
    
    els.spinButton.disabled = gameState.balance < gameState.currentBet || gameState.isSpinning;
    
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
    updateResultDisplay('😈', 'Çarkı Çevir!', '#F472B6');
    els.flavorText.textContent = 'Yeni oyun başladı! İyi şanslar!';
}

// Initialize
window.addEventListener('DOMContentLoaded', init);
