// ==========================================
// MY TRAVEL — Currency Service
// ==========================================

const CACHE_KEY = 'mytravel_exchange_rates';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Fallback rates (BRL base)
const FALLBACK_RATES = {
  BRL: 1,
  USD: 0.18,
  EUR: 0.16,
  GBP: 0.14,
  JPY: 26.5,
  ARS: 190,
  CLP: 165,
  COP: 720,
  MXN: 3.1,
  CAD: 0.25,
  AUD: 0.28,
  CHF: 0.16
};

class CurrencyService {
  constructor() {
    this.rates = null;
    this.baseCurrency = 'BRL';
    this._loadCache();
  }

  _loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          this.rates = data.rates;
          this.baseCurrency = data.base;
        }
      }
    } catch {
      // ignore
    }
  }

  _saveCache(rates, base) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates,
        base,
        timestamp: Date.now()
      }));
    } catch {
      // ignore
    }
  }

  async fetchRates(base = 'BRL') {
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/open/latest/${base}`);
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      if (data.result === 'success' && data.rates) {
        this.rates = data.rates;
        this.baseCurrency = base;
        this._saveCache(data.rates, base);
        return true;
      }
    } catch (e) {
      console.warn('Failed to fetch exchange rates, using fallback:', e);
      this.rates = FALLBACK_RATES;
      this.baseCurrency = 'BRL';
    }
    return false;
  }

  getRates() {
    return this.rates || FALLBACK_RATES;
  }

  /**
   * Convert amount from one currency to another
   */
  convert(amount, from, to) {
    if (from === to) return amount;
    const rates = this.getRates();

    // If we have rates based on BRL
    if (this.baseCurrency === 'BRL') {
      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      // Convert from source to BRL, then to target
      return (amount / fromRate) * toRate;
    }

    // Generic conversion
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    return (amount / fromRate) * toRate;
  }

  /**
   * Get the rate between two currencies
   */
  getRate(from, to) {
    return this.convert(1, from, to);
  }

  /**
   * Format with automatic currency conversion display
   */
  formatConverted(amount, fromCurrency, toCurrency) {
    const converted = this.convert(amount, fromCurrency, toCurrency);
    return converted.toLocaleString('pt-BR', {
      style: 'currency',
      currency: toCurrency,
      minimumFractionDigits: 2
    });
  }
}

export const currencyService = new CurrencyService();
export default currencyService;
