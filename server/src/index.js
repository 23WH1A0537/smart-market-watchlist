const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { fallbackQuotes, getQuote } = require('./marketProvider')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  previousPrice: Number,
  lastSeenPrice: Number,
  lastSeenAt: Date,
}, { timestamps: true })
const Holding = mongoose.model('Holding', holdingSchema)

function classifySignal(quote) {
  if (quote.volumeRatio >= 2.5) return { label: 'Unusual volume', detail: `Volume is ${quote.volumeRatio}x higher than usual ahead of earnings.` }
  if (Math.abs(quote.change) >= 3) return { label: 'Breakout', detail: 'Price moved beyond its recent range and deserves a closer look.' }
  if (Math.abs(quote.change) >= 1) return { label: 'Momentum', detail: 'Relative strength improved after a quiet recent range.' }
  return { label: 'Steady', detail: 'No meaningful change since your last visit.' }
}

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'signal-api' }))
app.get('/api/market/quotes', async (request, response) => {
  const symbols = (request.query.symbols || Object.keys(fallbackQuotes)).split(',').map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)
  const quotes = await Promise.all(symbols.map(async (symbol) => { const quote = await getQuote(symbol); return { ...quote, signal: classifySignal(quote) } }))
  response.json({ asOf: new Date().toISOString(), source: 'market-provider', delayed: true, quotes })
})

app.get('/api/watchlist', async (_request, response) => {
  try {
    const holdings = await Holding.find().sort({ createdAt: 1 }).lean()
    response.json(holdings)
  } catch (error) { response.status(500).json({ error: 'Could not load watchlist.' }) }
})
app.get('/api/watchlist/changes', async (_request, response) => {
  try {
    const holdings = await Holding.find().sort({ createdAt: 1 }).lean()
    const changes = await Promise.all(holdings.map(async (holding) => {
      const quote = await getQuote(holding.symbol)
      const baseline = holding.lastSeenPrice || quote.price
      const sinceLastChecked = baseline ? ((quote.price - baseline) / baseline) * 100 : 0
      return { ...holding, quote, sinceLastChecked: Number(sinceLastChecked.toFixed(2)), meaningful: Math.abs(sinceLastChecked) >= 1 || quote.volumeRatio >= 2 }
    }))
    response.json({ checkedAt: new Date().toISOString(), changes })
  } catch (_error) { response.status(500).json({ error: 'Could not calculate watchlist changes.' }) }
})
app.post('/api/watchlist', async (request, response) => {
  try {
    const symbol = request.body.symbol?.trim().toUpperCase()
    if (!symbol) return response.status(400).json({ error: 'A ticker symbol is required.' })
    const quote = fallbackQuotes[symbol] || { name: `${symbol} Holdings`, price: 100 }
    const holding = await Holding.create({ symbol, name: quote.name, previousPrice: quote.price, lastSeenPrice: quote.price, lastSeenAt: new Date() })
    response.status(201).json(holding)
  } catch (error) {
    response.status(error.code === 11000 ? 409 : 500).json({ error: 'Could not add that holding.' })
  }
})
app.delete('/api/watchlist/:symbol', async (request, response) => {
  await Holding.deleteOne({ symbol: request.params.symbol.toUpperCase() })
  response.status(204).end()
})

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signal')
  .then(() => app.listen(port, () => console.log(`Signal API listening on ${port}`)))
  .catch(() => app.listen(port, () => console.log(`Signal API listening on ${port} without MongoDB (demo mode)`)))