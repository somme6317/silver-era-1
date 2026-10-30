// Currency Dataset with Symbols and Names
const currencies = {
    USD: { name: "United States Dollar", symbol: "$" },
    EUR: { name: "Euro", symbol: "€" },
    GBP: { name: "British Pound Sterling", symbol: "£" },
    JPY: { name: "Japanese Yen", symbol: "¥" },
    CAD: { name: "Canadian Dollar", symbol: "CA$" },
    AUD: { name: "Australian Dollar", symbol: "AU$" },
    CHF: { name: "Swiss Franc", symbol: "CHF" },
    CNY: { name: "Chinese Yuan", symbol: "¥" },
    INR: { name: "Indian Rupee", symbol: "₹" },
    NGN: { name: "Nigerian Naira", symbol: "₦" },
    ZAR: { name: "South African Rand", symbol: "R" },
    BTC: { name: "Bitcoin", symbol: "₿" },
    ETH: { name: "Ethereum", symbol: "Ξ" }
};

// Fallback Exchange Rates against USD (Simulated real-time market rates)
let exchangeRates = {
    USD: 1.00,
    EUR: 0.9245,
    GBP: 0.7820,
    JPY: 155.42,
    CAD: 1.3650,
    AUD: 1.5290,
    CHF: 0.8950,
    CNY: 7.2300,
    INR: 83.35,
    NGN: 1450.00,
    ZAR: 18.45,
    BTC: 0.000015,
    ETH: 0.00038
};

// DOM Elements
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const fromAmountInput = document.getElementById('from-amount');
const toAmountInput = document.getElementById('to-amount');
const fromSymbol = document.getElementById('from-symbol');
const toSymbol = document.getElementById('to-symbol');
const rateDisplay = document.getElementById('rate-display');
const updateTimeDisplay = document.getElementById('update-time');
const swapBtn = document.getElementById('swap-btn');
const convertActionBtn = document.getElementById('convert-action-btn');
const feeTypeSelect = document.getElementById('fee-type');
const netAmountDisplay = document.getElementById('net-amount-display');
const netCurrencySymbol = document.getElementById('net-currency-symbol');
const matrixGrid = document.getElementById('matrix-grid');
const matrixBaseLabel = document.getElementById('matrix-base-label');
const statHigh = document.getElementById('stat-high');
const statLow = document.getElementById('stat-low');
const chartSubtitle = document.getElementById('chart-subtitle');

let fxChartInstance = null;

// Initialize Select Options
function initDropdowns() {
    let fromOptions = '';
    let toOptions = '';

    for (const [code, data] of Object.entries(currencies)) {
        fromOptions += `<option value="${code}">${code} — ${data.name}</option>`;
        toOptions += `<option value="${code}">${code} — ${data.name}</option>`;
    }

    fromCurrencySelect.innerHTML = fromOptions;
    toCurrencySelect.innerHTML = toOptions;

    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'EUR';
}

// Calculate and Update Conversion
function convertCurrency() {
    const amount = parseFloat(fromAmountInput.value) || 0;
    const fromCurr = fromCurrencySelect.value;
    const toCurr = toCurrencySelect.value;

    // Update Symbols
    fromSymbol.textContent = currencies[fromCurr].symbol;
    toSymbol.textContent = currencies[toCurr].symbol;
    netCurrencySymbol.textContent = toCurr;

    // Conversion formula via USD base
    const rateInUSD = exchangeRates[fromCurr];
    const rateOutUSD = exchangeRates[toCurr];
    const conversionRate = rateOutUSD / rateInUSD;

    const convertedAmount = amount * conversionRate;
    toAmountInput.value = convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

    // Display rate string
    rateDisplay.textContent = `1 ${fromCurr} = ${conversionRate.toFixed(4)} ${toCurr}`;
    updateTimeDisplay.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    // Calculate Net with Fee
    let feeMultiplier = 1.0;
    const feeType = feeTypeSelect.value;
    if (feeType === 'percentage') {
        feeMultiplier = 0.985; // 1.5% fee
    } else if (feeType === 'flat') {
        const feeDeduction = 5.0 * conversionRate;
        const netFlat = Math.max(0, convertedAmount - feeDeduction);
        netAmountDisplay.textContent = netFlat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        updateMatrix(fromCurr);
        return;
    }

    const netTotal = convertedAmount * feeMultiplier;
    netAmountDisplay.textContent = netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    updateMatrix(fromCurr);
}

// Swap Currencies
swapBtn.addEventListener('click', () => {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    convertCurrency();
    showToast("Currencies swapped successfully!", "success");
});

// Update Matrix Grid
function updateMatrix(baseCurr) {
    matrixBaseLabel.textContent = baseCurr;
    let html = '';
    const popularTargets = ['EUR', 'GBP', 'JPY', 'CAD', 'NGN', 'BTC'];

    popularTargets.forEach(target => {
        if (target !== baseCurr) {
            const rate = exchangeRates[target] / exchangeRates[baseCurr];
            html += `
                <div class="bg-gray-900/80 p-3 rounded-xl border border-gray-800 flex items-center justify-between font-mono">
                    <div>
                        <span class="block text-xs font-bold text-white">${baseCurr}/${target}</span>
                        <span class="text-[10px] text-gray-500">${currencies[target].name.substring(0, 12)}...</span>
                    </div>
                    <span class="text-xs font-semibold text-yellow-400">${rate > 1 ? rate.toFixed(2) : rate.toFixed(4)}</span>
                </div>
            `;
        }
    });
    matrixGrid.innerHTML = html;
}

// Initialize Chart.js
function initChart() {
    const ctx = document.getElementById('fxChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(234, 179, 8, 0.3)');
    gradient.addColorStop(1, 'rgba(234, 179, 8, 0.0)');

    fxChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Exchange Rate',
                data: [0.918, 0.921, 0.920, 0.925, 0.922, 0.924, 0.9245],
                borderColor: '#eab308',
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#eab308'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    titleColor: '#eab308',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
                }
            }
        }
    });
}

// Update Chart Timeframe
function updateChartTimeframe(tf) {
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.classList.remove('bg-yellow-500', 'text-gray-950', 'shadow-md');
        btn.classList.add('text-gray-400');
    });
    event.target.classList.add('bg-yellow-500', 'text-gray-950', 'shadow-md');
    event.target.classList.remove('text-gray-400');

    chartSubtitle.textContent = `Historical spread for ${fromCurrencySelect.value}/${toCurrencySelect.value} (${tf})`;

    let newData = [];
    let labels = [];
    if (tf === '1W') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        newData = [0.918, 0.921, 0.920, 0.925, 0.922, 0.924, 0.9245];
    } else if (tf === '1M') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        newData = [0.910, 0.915, 0.922, 0.9245];
    } else {
        labels = ['Q1', 'Q2', 'Q3', 'Q4'];
        newData = [0.895, 0.905, 0.915, 0.9245];
    }

    fxChartInstance.data.labels = labels;
    fxChartInstance.data.datasets[0].data = newData;
    fxChartInstance.update();
}

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `glass-panel px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-medium text-white border-l-4 ${type === 'success' ? 'border-l-yellow-400' : 'border-l-emerald-400'} animate-fade-in pointer-events-auto`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-yellow-400' : 'fa-bell text-emerald-400'} text-sm"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function triggerQuickSwapToast() {
    showToast(`Live FX rates synchronized with global market feed.`, 'info');
}

// Event Listeners
fromAmountInput.addEventListener('input', convertCurrency);
fromCurrencySelect.addEventListener('change', convertCurrency);
toCurrencySelect.addEventListener('change', convertCurrency);
feeTypeSelect.addEventListener('change', convertCurrency);
convertActionBtn.addEventListener('click', () => {
    showToast(`Conversion of ${fromAmountInput.value} ${fromCurrencySelect.value} successfully computed!`, 'success');
});

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
    initDropdowns();
    convertCurrency();
    initChart();
});
// Replace with your actual free API key from ExchangeRate-API
const API_KEY = 'e68b99daf6321762568d378c';
const API_URL = `https://v6.exchangerate-api.com/v6/e68b99daf6321762568d378c/latest/USD`;

// Fetch live rates from the API
async function fetchLiveRates() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.result === "success") {
            // Map API rates into your exchangeRates object
            exchangeRates = data.conversion_rates;
            document.getElementById('live-status').textContent = "Live API Connected";
            showToast("Successfully synchronized with live global exchange rates!", "success");
        } else {
            console.warn("API returned non-success result, using fallback rates.");
        }
    } catch (error) {
        console.error("Failed to fetch live rates, using fallback:", error);
        showToast("Network offline: Using cached exchange rates.", "info");
    } finally {
        // Run conversion once rates are loaded
        convertCurrency();
        initChart();
    }
}

// Update your window DOMContentLoaded event listener to call fetchLiveRates() instead of convertCurrency() directly:
window.addEventListener('DOMContentLoaded', () => {
    initDropdowns();
    fetchLiveRates(); // This fetches data first, then initializes calculations
});
fromCurrencySelect.addEventListener('change', () => {
    localStorage.setItem('savedFromCurrency', fromCurrencySelect.value);
    convertCurrency();
});

toCurrencySelect.addEventListener('change', () => {
    localStorage.setItem('savedToCurrency', toCurrencySelect.value);
    convertCurrency();
});

// 2. LOAD from localStorage when the page loads (inside initDropdowns or DOMContentLoaded)
function initDropdowns() {
    let fromOptions = '';
    let toOptions = '';

    for (const [code, data] of Object.entries(currencies)) {
        fromOptions += `<option value="${code}">${code} — ${data.name}</option>`;
        toOptions += `<option value="${code}">${code} — ${data.name}</option>`;
    }

    fromCurrencySelect.innerHTML = fromOptions;
    toCurrencySelect.innerHTML = toOptions;

    // Check if saved preferences exist, otherwise use defaults ('USD' and 'EUR')
    const savedFrom = localStorage.getItem('savedFromCurrency');
    const savedTo = localStorage.getItem('savedToCurrency');

    fromCurrencySelect.value = savedFrom ? savedFrom : 'USD';
    toCurrencySelect.value = savedTo ? savedTo : 'EUR';
}
