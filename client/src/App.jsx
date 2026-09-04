import { useEffect, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Bell, ChevronDown, Plus, Search, ShieldCheck, Sparkles, Star, X } from 'lucide-react'
import './App.css'

const initialStocks = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 177.22, change: 4.82, signal: 'Breakout', detail: 'Trading above its 20-day average for the first time in 2 weeks.', volume: '2.4x avg', color: '#77d6a1' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1_431.65, change: -2.14, signal: 'Unusual volume', detail: 'Volume is 3.1x higher than usual ahead of earnings.', volume: '3.1x avg', color: '#f0a46c' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 233.98, change: 1.08, signal: 'Momentum', detail: 'Relative strength improved after a quiet 5-day range.', volume: '1.4x avg', color: '#9eb4ff' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3_122.40, change: 0.42, signal: 'Steady', detail: 'No meaningful change since your last visit.', volume: '0.9x avg', color: '#e7c46a' },
]
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function App() {
  const [stocks, setStocks] = useState(initialStocks)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState('Changes')

  const filteredStocks = stocks.filter((stock) => `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.toLowerCase()))
  const changedStocks = filteredStocks.filter((stock) => stock.signal !== 'Steady')
  const displayStocks = activeTab === 'Changes' ? changedStocks : filteredStocks

  useEffect(() => {
    fetch(`${API_URL}/market/quotes?symbols=${initialStocks.map((stock) => stock.symbol).join(',')}`)
      .then((response) => response.ok ? response.json() : { quotes: [] })
      .then(({ quotes }) => {
        if (quotes.length) setStocks(quotes.map((quote) => ({ symbol: quote.symbol, name: quote.name, price: quote.price, change: quote.change, signal: quote.signal.label, detail: quote.signal.detail, volume: `${quote.volumeRatio}x avg`, color: initialStocks.find((stock) => stock.symbol === quote.symbol)?.color || '#bb9cff' })))
      })
      .catch(() => {})
    fetch(`${API_URL}/watchlist`)
      .then((response) => response.ok ? response.json() : [])
      .then((holdings) => {
        if (holdings.length) setStocks(holdings.map((holding) => ({ ...initialStocks.find((stock) => stock.symbol === holding.symbol), ...holding, change: initialStocks.find((stock) => stock.symbol === holding.symbol)?.change || 0, signal: initialStocks.find((stock) => stock.symbol === holding.symbol)?.signal || 'Watching', detail: initialStocks.find((stock) => stock.symbol === holding.symbol)?.detail || 'We will surface meaningful movement here as data arrives.', volume: initialStocks.find((stock) => stock.symbol === holding.symbol)?.volume || '—', color: initialStocks.find((stock) => stock.symbol === holding.symbol)?.color || '#bb9cff' })))
      })
      .catch(() => {})
  }, [])

  function addStock(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const symbol = form.get('symbol').toString().trim().toUpperCase()
    if (!symbol || stocks.some((stock) => stock.symbol === symbol)) return
    setStocks([...stocks, { symbol, name: `${symbol} Holdings`, price: 100, change: 0, signal: 'Watching', detail: 'We will surface meaningful movement here as data arrives.', volume: '—', color: '#bb9cff' }])
    fetch(`${API_URL}/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol }) }).catch(() => {})
    setShowAdd(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark"><Activity size={18} /></span>signal<span className="brand-dot">.</span></a><div className="top-actions"><span className="market-status"><i /> Market open</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><span className="avatar">NS</span></div></header>
      <section className="intro"><div><p className="eyebrow"><Sparkles size={14} /> Your market, made legible</p><h1>Know what changed.<br /><em>Act with context.</em></h1><p className="subtitle">A calmer way to track the signals that matter across your watchlist.</p></div><div className="last-checked"><span>Last checked</span><strong>Today, 10:42 AM</strong><small><ShieldCheck size={13} /> Data is fresh</small></div></section>
      <section className="toolbar"><div className="tabs">{['Changes', 'All holdings'].map((tab) => <button className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)} key={tab}>{tab}<span>{tab === 'Changes' ? changedStocks.length : stocks.length}</span></button>)}</div><div className="toolbar-actions"><label className="search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search watchlist" /></label><button className="add-button" onClick={() => setShowAdd(true)}><Plus size={17} /> Add to watchlist</button></div></section>
      <section className="summary"><div><span className="summary-label">Meaningful changes</span><strong>{changedStocks.length}<small> / {stocks.length} holdings</small></strong></div><div className="summary-note"><span className="pulse" /> Updated just now <span className="divider" /> Based on price, volume &amp; momentum</div></section>
      <section className="stock-list">{displayStocks.map((stock) => <article className="stock-row" style={{ '--accent': stock.color }} key={stock.symbol}><div className="stock-identity"><div className="ticker-icon">{stock.symbol.slice(0, 1)}</div><div><strong>{stock.symbol}</strong><span>{stock.name}</span></div></div><div className="stock-price"><strong>${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span className={stock.change >= 0 ? 'positive' : 'negative'}>{stock.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(stock.change).toFixed(2)}%</span></div><div className="change-context"><span className={`signal ${stock.signal === 'Steady' ? 'muted' : ''}`}><i /> {stock.signal}</span><p>{stock.detail}</p></div><div className="volume"><span>Volume</span><strong>{stock.volume}</strong></div><button className="star-button" aria-label={`Remove ${stock.symbol}`} onClick={() => { setStocks(stocks.filter((item) => item.symbol !== stock.symbol)); fetch(`${API_URL}/watchlist/${stock.symbol}`, { method: 'DELETE' }).catch(() => {}) }}><Star size={18} fill="currentColor" /></button></article>)}</section>
      <footer><span><span className="live-dot" /> Prices delayed by up to 15 min</span><span>Powered by market data API <ChevronDown size={14} /></span></footer>
      {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><form className="modal" onSubmit={addStock} onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => setShowAdd(false)}><X size={18} /></button><p className="eyebrow">WATCHLIST</p><h2>Add a holding</h2><p>Enter a ticker to start tracking its meaningful changes.</p><input name="symbol" autoFocus placeholder="e.g. MSFT" /><button className="add-button" type="submit">Add holding <Plus size={16} /></button></form></div>}
    </main>
  )
}

export default App
