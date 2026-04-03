import { useState } from 'react'

function SignalPill({ label, value, color }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-gray-500">{label}:</span>
      <span className={`font-semibold capitalize ${color}`}>{value}</span>
    </span>
  )
}

function Divider() {
  return <span className="text-gray-700 select-none">|</span>
}
import StockOverview from '../components/StockOverview'
import TrendCard from '../components/TrendCard'
import PriceChart from '../components/PriceChart'
import RecommendationCard from '../components/RecommendationCard'

const CURRENCY_SYMBOL = { USD: '$', INR: '₹' }

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [market, setMarket] = useState('US')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currencySymbol = data ? (CURRENCY_SYMBOL[data.currency] ?? data.currency) : '$'

  const analyze = async () => {
    let symbol = ticker.trim().toUpperCase()
    if (!symbol) return
    if (market === 'IN' && !symbol.includes('.')) symbol += '.NS'
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`http://localhost:8000/analyze?ticker=${symbol}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch data')
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Stock Copilot</h1>
          <p className="text-gray-400 mt-1 text-sm">Rule-based stock analysis for smarter entry decisions</p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
          >
            <option value="US">🇺🇸 US</option>
            <option value="IN">🇮🇳 India (NSE)</option>
          </select>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            placeholder={market === 'IN' ? 'e.g. RELIANCE, TCS, INFY' : 'e.g. NVDA, AAPL, AMD'}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-base"
          />
          <button
            onClick={analyze}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Fetching market data...</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-4">

            {/* Key Signal Strip */}
            <div className="flex flex-wrap items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-sm">
              <SignalPill
                label="Trend"
                value={data.trend}
                color={data.trend === 'bullish' ? 'text-green-400' : data.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'}
              />
              <Divider />
              <SignalPill
                label="Valuation"
                value={data.valuation}
                color={data.valuation === 'undervalued' ? 'text-green-400' : data.valuation === 'overvalued' ? 'text-red-400' : data.valuation === 'fair' ? 'text-blue-400' : 'text-gray-400'}
              />
              <Divider />
              <SignalPill
                label="Pullback"
                value={data.pullback_percentage != null ? `-${Math.abs(data.pullback_percentage)}%` : 'N/A'}
                color={data.dip_type === 'strong' ? 'text-green-400' : data.dip_type === 'weak' ? 'text-yellow-400' : 'text-red-400'}
              />
              <Divider />
              <SignalPill
                label="Dip"
                value={data.dip_type}
                color={data.dip_type === 'strong' ? 'text-green-400' : data.dip_type === 'weak' ? 'text-yellow-400' : 'text-red-400'}
              />
              <Divider />
              <SignalPill
                label="Signal"
                value={data.recommendation}
                color={data.dip_type === 'strong' ? 'text-green-400' : data.dip_type === 'danger' ? 'text-red-400' : 'text-yellow-400'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <StockOverview data={data} currency={currencySymbol} />
              </div>
              <RecommendationCard
                recommendation={data.recommendation}
                trend={data.trend}
                valuation={data.valuation}
                exchange={data.exchange}
              />
            </div>
            <PriceChart chartData={data.chart_data} ticker={data.resolved_ticker} currency={currencySymbol} />
            <TrendCard data={data} currency={currencySymbol} />
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="text-center py-24 text-gray-600 text-sm">
            Enter a ticker above to begin analysis
          </div>
        )}
      </div>
    </div>
  )
}
