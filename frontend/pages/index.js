import { useState } from 'react'
import StockOverview from '../components/StockOverview'
import TrendCard from '../components/TrendCard'
import PriceChart from '../components/PriceChart'
import RecommendationCard from '../components/RecommendationCard'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyze = async () => {
    const symbol = ticker.trim().toUpperCase()
    if (!symbol) return
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
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            placeholder="Enter ticker symbol (e.g. NVDA, AMD, AAPL)"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <StockOverview data={data} />
              </div>
              <RecommendationCard
                recommendation={data.recommendation}
                trend={data.trend}
                valuation={data.valuation}
              />
            </div>
            <PriceChart chartData={data.chart_data} ticker={data.ticker} />
            <TrendCard data={data} />
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
