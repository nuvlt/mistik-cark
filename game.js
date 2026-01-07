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
    '🪙': { type: 'gold', weight: 18, title: 'Altın!' },
    '💎': { type: 'diamond', weight: 15, title: 'Pırlanta!' },
    '🔮': { type: 'magic', weight: 10, value: 20, title: 'Büyülü Küre (20₺)' },
    '🌙': { type: 'money', weight: 8, value: 50, title: 'Ay Işığı (50₺)' },
    '⭐': { type: 'money', weight: 6, value: 100, title: 'Kayan Yıldız (100₺)' },
    '🌞': { type: 'money', weight: 4, value: 250, title: 'Güneş Patlaması (250₺)' },
    '⚡': { type: 'multiplier', weight: 5, value: 0.3, title: 'Şimşek (0.3x)' },
    '🌀': { type: 'multiplier', weight: 4, value: 0.6, title: 'Girdap (0.6x)' },
    '✨': { type: 'multiplier', weight: 3, value: 1.2, title: 'Parıltı (1.2x)' },
    '👾': { type: 'empty', weight: 30, title: 'Hiçlik...' }
};

const totalWeight = Object.values(symbols).reduce((sum, s) => sum + s.weight, 0);

// DOM Elements
const els = {
    spinButton: document.getElementById('spin-button'),
    betDisplay: document.getElementById('bet-display'),
    betInput: document.getElementById('bet-input'),
    resultSymbol: document.getElementById('result-symbol'),
    resultText: document.getElementById('result-text'),
    balance: document.getElementById('balance'),
    totalWin: document.getElementById('total-win'),
    highestWin: document.getElementById('highest-win'),
    flavorText: document.getElementById('flavor-text'),
    winPopup: document.getElementById('win-popup'),
    winPopupContent: document.getElementById('win-popup-content'),
    winIcon: document.getElementById('win-icon'),
    winMessage: document.getElementById('win-message'),
    winAmount: document.getElementById('win-amount'),
    continueBtn: document.getElementById('continue-btn'),
    goldProgress: document.getElementById('gold-progress'),
    diamondProgress: document.getElementById('diamond-progress')
};

// Init
function init() {
    updateDisplay();

    els.spinButton.addEventListener('click', spin);
    document.getElementById('decrease-bet').addEventListener('click', () => adjustBet(-5));
    document.getElementById('increase-bet').addEventListener('click', () => adjustBet(5));

    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.currentBet = parseInt(btn.dataset.bet);
            updateDisplay();
            updateQuickBets();
        });
    });

    els.continueBtn.addEventListener('click', hideWinPopup);
}

// Adjust Bet
function adjustBet(amount) {
    const newBet = gameState.currentBet + amount;
    if (newBet >= config.minBet && newBet <= config.maxBet && newBet <= gameState.balance + gameState.currentBet) { // Logic fix: check against potential balance
        gameState.currentBet = newBet;
        updateDisplay();
        updateQuickBets();
    }
}

// Update Quick Bets Visuals
function updateQuickBets() {
    document.querySelectorAll('.quick-bet').forEach(btn => {
        const amount = parseInt(btn.dataset.bet);
        if (amount === gameState.currentBet) {
            btn.classList.add('border-purple-500', 'bg-purple-500/20', 'text-white', 'shadow-[0_0_10px_rgba(124,58,237,0.3)]');
            btn.classList.remove('border-white/5', 'bg-white/5', 'text-arcane-100');
        } else {
            btn.classList.remove('border-purple-500', 'bg-purple-500/20', 'text-white', 'shadow-[0_0_10px_rgba(124,58,237,0.3)]');
            btn.classList.add('border-white/5', 'bg-white/5', 'text-arcane-100');
        }
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
    return '👾';
}

// Advanced Spin Animation (Easing + RequestAnimationFrame)
async function animateSpin(finalSymbol) {
    return new Promise(resolve => {
        const symbolKeys = Object.keys(symbols);
        const duration = 2000; // ms
        const startTime = performance.now();

        // Easing function: Cubic Ease Out
        // Allows start fast, end slow
        const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

        let lastSymbolIndex = -1;
        let lastUpdate = 0;
        const baseInterval = 50; // Fastest speed in ms

        function tick(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Calculate current interval based on progress (slowing down)
            // Start at 50ms, end at 400ms
            const currentInterval = baseInterval + (easeOutCubic(progress) * 350);

            if (currentTime - lastUpdate > currentInterval) {
                // Change Symbol
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * symbolKeys.length);
                } while (newIndex === lastSymbolIndex);

                lastSymbolIndex = newIndex;
                els.resultSymbol.textContent = symbolKeys[newIndex];

                // Add blur effect based on speed
                if (progress < 0.8) {
                    els.resultSymbol.style.filter = 'blur(2px)';
                    els.resultSymbol.style.transform = 'scale(0.9) rotate(' + (Math.random() * 20 - 10) + 'deg)';
                } else {
                    els.resultSymbol.style.filter = 'blur(0px)';
                    els.resultSymbol.style.transform = 'scale(1.1)';
                }

                lastUpdate = currentTime;
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                // Finish
                els.resultSymbol.textContent = finalSymbol;
                els.resultSymbol.style.filter = 'none';
                els.resultSymbol.style.transform = 'scale(1.2) rotate(0deg)';
                gameState.isSpinning = false;

                // Impact Effect
                setTimeout(() => els.resultSymbol.style.transform = 'scale(1)', 200);
                resolve();
            }
        }

        requestAnimationFrame(tick);
    });
}

// Main Spin
async function spin() {
    if (gameState.isSpinning) return;

    if (gameState.balance < gameState.currentBet) {
        els.flavorText.textContent = 'Büyülü enerjin (bakiyen) tükendi!';
        shakeElement(els.balance.parentElement);
        return;
    }

    gameState.isSpinning = true;
    gameState.balance -= gameState.currentBet;
    gameState.spinCount++;
    updateDisplay();

    els.spinButton.disabled = true;
    els.flavorText.textContent = 'Kozmos dönüyor...';

    const result = getRandomSymbol();

    await animateSpin(result);

    await handleResult(result);

    gameState.isSpinning = false;
    els.spinButton.disabled = false;
    updateDisplay();
}

async function handleResult(symbol) {
    const symbolConfig = symbols[symbol];
    els.resultText.textContent = symbolConfig.title;

    let winAmount = 0;
    let isSpecial = false;

    // reset visuals
    els.resultSymbol.classList.remove('animate-pulse');

    if (symbolConfig.type === 'gold') {
        gameState.goldSlots++;
        updateProgress('gold');
        if (gameState.goldSlots >= 3) {
            winAmount = config.goldReward;
            isSpecial = true;
            gameState.goldSlots = 0;
            setTimeout(() => resetProgress('gold'), 1000);
        }
    } else if (symbolConfig.type === 'diamond') {
        gameState.diamondSlots++;
        updateProgress('diamond');
        if (gameState.diamondSlots >= 3) {
            winAmount = config.diamondReward;
            isSpecial = true;
            gameState.diamondSlots = 0;
            setTimeout(() => resetProgress('diamond'), 1000);
        }
    } else if (symbolConfig.type === 'money' || symbolConfig.type === 'magic') {
        winAmount = symbolConfig.value;
    } else if (symbolConfig.type === 'multiplier') {
        winAmount = Math.floor(gameState.currentBet * symbolConfig.value);
    }

    if (winAmount > 0) {
        if (isSpecial || winAmount >= gameState.currentBet * 2) {
            showWinPopup(winAmount, isSpecial);
        } else {
            // Small win visual feedback
            els.resultSymbol.classList.add('animate-pulse');
        }

        gameState.balance += winAmount;
        gameState.totalWin += winAmount;
        gameState.highestWin = Math.max(gameState.highestWin, winAmount);
    } else {
        els.flavorText.textContent = 'Boşlukta kayboldu... Tekrar dene.';
    }
}

function updateProgress(type) {
    const container = els[type + 'Progress'];
    const slots = container.children;
    const count = type === 'gold' ? gameState.goldSlots : gameState.diamondSlots;
    const colorClass = type === 'gold' ? 'bg-yellow-400' : 'bg-cyan-400';
    const shadowClass = type === 'gold' ? 'shadow-[0_0_10px_#facc15]' : 'shadow-[0_0_10px_#22d3ee]';

    for (let i = 0; i < 3; i++) {
        if (i < count) {
            slots[i].className = `w-4 h-4 rounded-full ${colorClass} ${shadowClass} shadow-lg transition-all duration-300 scale-110`;
        }
    }
}

function resetProgress(type) {
    const container = els[type + 'Progress'];
    const slots = container.children;
    for (let i = 0; i < 3; i++) {
        slots[i].className = 'w-4 h-4 rounded-full bg-white/5 border border-white/10 transition-all duration-300';
    }
}

function showWinPopup(amount, isSpecial) {
    els.winAmount.textContent = amount + '₺';
    els.winMessage.textContent = isSpecial ? 'BÜYÜK GÜÇ!' : 'KAZANDINIZ!';

    els.winPopup.classList.remove('hidden');
    els.winPopup.classList.add('flex');

    // Trigger fade in
    requestAnimationFrame(() => {
        els.winPopup.classList.remove('opacity-0');
        els.winPopupContent.classList.remove('scale-90');
        els.winPopupContent.classList.add('scale-100');
    });

    createConfetti();
}

function hideWinPopup() {
    els.winPopup.classList.add('opacity-0');
    els.winPopupContent.classList.remove('scale-100');
    els.winPopupContent.classList.add('scale-90');

    setTimeout(() => {
        els.winPopup.classList.add('hidden');
        els.winPopup.classList.remove('flex');
    }, 300);
}

function updateDisplay() {
    els.balance.textContent = Math.floor(gameState.balance) + '₺';
    els.betDisplay.textContent = gameState.currentBet; // Fixed: removed extra symbol
    els.totalWin.textContent = Math.floor(gameState.totalWin) + '₺';
    els.highestWin.textContent = Math.floor(gameState.highestWin) + '₺';
}

function shakeElement(element) {
    element.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' }
    ], {
        duration: 300,
        iterations: 1
    });
}

function createConfetti() {
    const colors = ['#a855f7', '#ec4899', '#facc15', '#22d3ee'];

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${50 + (Math.random() * 20 - 10)}%;
            top: ${50 + (Math.random() * 20 - 10)}%;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
        `;

        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 100;

        particle.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }
}

// Init Game
window.addEventListener('DOMContentLoaded', init);
