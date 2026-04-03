import { useState } from 'react'
import Link from 'next/link'

const FILTERS = [
  { label: 'Strong Dips', fn: (r) => r.dip_type === 'strong' },
  { label: 'Bullish Only', fn: (r) => r.trend === 'bullish' },
  { label: 'All',          fn: () => true },
]

const CURRENCY = { INR: '₹', USD: '$' }
const dipColor   = (d) => d === 'strong' ? 'text-green-400' : d === 'danger' ? 'text-red-400' : 'text-yellow-400'
const trendColor = (t) => t === 'bullish' ? 'text-green-400' : t === 'bearish' ? 'text-red-400' : 'text-yellow-400'
const recColor   = (r) => r === 'Consider Entering' ? 'text-green-400' : r === 'Avoid' ? 'text-red-400' : 'text-yellow-400'
const scoreColor = (l) => l === 'High Conviction' ? 'text-green-400' : l === 'Watch' ? 'text-yellow-400' : 'text-red-400'

function MarketTrendBadge({ label, trend }) {
  const color = trendColor(trend)
  const bg    = trend === 'bullish' ? 'bg-green-950/40 border-green-800'
              : trend === 'bearish' ? 'bg-red-950/40 border-red-800'
              : 'bg-yellow-950/40 border-yellow-800'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${bg} ${color}`}>
      {label}: <span className="capitalize">{trend ?? '–'}</span>
    </span>
  )
}

export default function Scanner() {
  const [stocks, setStocks]         = useState([])
  const [marketTrends, setMarketTrends] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [filter, setFilter]         = useState('Strong Dips')
  const [market, setMarket]         = useState('all')
  const [hasScanned, setHasScanned] = useState(false)
  const [error, setError]           = useState(null)

  const runScan = async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`http://localhost:8000/scan?market=${market}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Scan failed')
      setStocks(data.stocks)
      setMarketTrends(data.market_trends)
      setHasScanned(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const activeFilter = FILTERS.find((f) => f.label === filter) || FILTERS[0]
  const filtered     = stocks.filter(activeFilter.fn)
  const strongCount  = stocks.filter((r) => r.dip_type === 'strong').length
  const stockCount   = market === 'us' ? US_STOCKS_COUNT : market === 'india' ? INDIA_STOCKS_COUNT : US_STOCKS_COUNT + INDIA_STOCKS_COUNT

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scanner</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Scan US + India stocks for dip opportunities
            </p>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors mt-1">
            ← Copilot
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            disabled={loading}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer disabled:opacity-50"
          >
            <option value="all">All Markets</option>
            <option value="us">🇺🇸 US</option>
            <option value="india">🇮🇳 India</option>
          </select>
          <button
            onClick={runScan}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Scanning...' : hasScanned ? 'Scan Again' : 'Run Scan'}
          </button>

          {hasScanned && !loading && (
            <>
              <div className="flex gap-2">
                {FILTERS.map(({ label }) => (
                  <button
                    key={label}
                    onClick={() => setFilter(label)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === label
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {strongCount > 0 && (
                <span className="text-green-400 text-sm font-medium">
                  {strongCount} opportunit{strongCount !== 1 ? 'ies' : 'y'} found
                </span>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Spinner */}
        {loading && (
          <div className="flex flex-col items-center py-24 text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Scanning {stockCount} stocks in parallel...</p>
          </div>
        )}

        {/* Market Trend Bar */}
        {!loading && hasScanned && marketTrends && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest mr-1">Market</span>
            {marketTrends.us    && <MarketTrendBadge label="US (S&P 500)"  trend={marketTrends.us.trend}    />}
            {marketTrends.india && <MarketTrendBadge label="India (Nifty)" trend={marketTrends.india.trend} />}
          </div>
        )}

        {/* Results */}
        {!loading && hasScanned && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Results</p>
              <span className="text-gray-600 text-xs">{filtered.length} stock{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {filtered.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-10">
                No stocks match this filter right now.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800">
                      <th className="text-left pb-3 font-medium">Ticker</th>
                      <th className="text-right pb-3 font-medium">Price</th>
                      <th className="text-right pb-3 font-medium">Trend</th>
                      <th className="text-right pb-3 font-medium">Pullback</th>
                      <th className="text-right pb-3 font-medium">Dip Signal</th>
                      <th className="text-right pb-3 font-medium">Recommendation</th>
                      <th className="text-right pb-3 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((stock) => {
                      const isStrong = stock.dip_type === 'strong'
                      const sym = CURRENCY[stock.currency] ?? '$'
                      return (
                        <tr
                          key={stock.ticker}
                          className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                            isStrong ? 'bg-green-950/25' : ''
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white">{stock.ticker}</span>
                              <span className="text-gray-500 text-xs hidden sm:inline">{stock.name}</span>
                              {isStrong && (
                                <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full font-medium">
                                  Opportunity
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right text-white font-medium whitespace-nowrap">
                            {sym}{stock.price?.toLocaleString()}
                          </td>
                          <td className={`py-3 text-right capitalize font-medium ${trendColor(stock.trend)}`}>
                            {stock.trend}
                          </td>
                          <td className={`py-3 text-right font-medium ${dipColor(stock.dip_type)}`}>
                            {stock.pullback_percentage != null
                              ? `-${Math.abs(stock.pullback_percentage)}%`
                              : 'N/A'}
                          </td>
                          <td className={`py-3 text-right capitalize font-medium ${dipColor(stock.dip_type)}`}>
                            {stock.dip_type}
                          </td>
                          <td className={`py-3 text-right font-medium ${recColor(stock.recommendation)}`}>
                            {stock.recommendation}
                          </td>
                          <td className="py-3 text-right whitespace-nowrap">
                            <span className={`font-bold ${scoreColor(stock.score_label)}`}>{stock.score}</span>
                            <span className={`ml-1.5 text-xs ${scoreColor(stock.score_label)}`}>{stock.score_label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasScanned && (
          <div className="text-center py-24 text-gray-600 text-sm">
            Click "Run Scan" to scan all predefined stocks
          </div>
        )}
      </div>
    </div>
  )
}

// used in the loading message
const US_STOCKS_COUNT = 4
const INDIA_STOCKS_COUNT = 3
