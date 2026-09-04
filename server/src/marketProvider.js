const axios = require('axios')

const fallbackQuotes = {
  NVDA: { name: 'NVIDIA Corporation', price: 177.22, change: 4.82, volumeRatio: 2.4 },
  RELIANCE: { name: 'Reliance Industries', price: 1431.65, change: -2.14, volumeRatio: 3.1 },
  AAPL: { name: 'Apple Inc.', price: 233.98, change: 1.08, volumeRatio: 1.4 },
  TCS: { name: 'Tata Consultancy Services', price: 3122.40, change: 0.42, volumeRatio: 0.9 },
}

const yahooSymbol = { RELIANCE: 'RELIANCE.NS', TCS: 'TCS.NS' }

async function getQuote(symbol) {
  const fallback = fallbackQuotes[symbol] || { name: `${symbol} Holdings`, price: 100, change: 0, volumeRatio: 1 }
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol[symbol] || symbol}`, { params: { range: '5d', interval: '1d' }, timeout: 3500 })
    const result = response.data.chart.result?.[0]
    const meta = result?.meta
    const closes = result?.indicators?.quote?.[0]?.close?.filter(Number.isFinite) || []
    const volumes = result?.indicators?.quote?.[0]?.volume?.filter(Number.isFinite) || []
    const price = meta?.regularMarketPrice || closes.at(-1)
    const previous = meta?.previousClose || closes.at(-2)
    if (!price || !previous) throw new Error('Provider returned incomplete quote')
    const averageVolume = volumes.length ? volumes.reduce((total, value) => total + value, 0) / volumes.length : 0
    return { symbol, name: meta.shortName || fallback.name, price, change: ((price - previous) / previous) * 100, volumeRatio: averageVolume ? (volumes.at(-1) / averageVolume) : fallback.volumeRatio, source: 'yahoo', delayed: true }
  } catch (_error) {
    return { symbol, ...fallback, source: 'fallback', delayed: true }
  }
}

module.exports = { fallbackQuotes, getQuote }