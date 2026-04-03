function formatMarketCap(cap, currency) {
  if (!cap) return 'N/A'
  if (cap >= 1e12) return `${currency}${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9) return `${currency}${(cap / 1e9).toFixed(2)}B`
  if (cap >= 1e6) return `${currency}${(cap / 1e6).toFixed(2)}M`
  return `${currency}${cap}`
}

export default function StockOverview({ data, currency }) {
  const { name, ticker, price, high_52w, low_52w, pe_ratio, market_cap } = data

  const range = high_52w - low_52w
  const position = range > 0 ? Math.min(Math.max(((price - low_52w) / range) * 100, 0), 100) : 50

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full">
      {/* Title + Price */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold">{ticker}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{currency}{price?.toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-0.5">Current Price</p>
        </div>
      </div>

      {/* 52-week range bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>52W Low: <span className="text-white font-medium">{currency}{low_52w ?? 'N/A'}</span></span>
          <span>52W High: <span className="text-white font-medium">{currency}{high_52w ?? 'N/A'}</span></span>
        </div>
        <div className="relative h-1.5 bg-gray-700 rounded-full">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 rounded-full opacity-40" />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-white/20"
            style={{ left: `${position}%` }}
          />
        </div>
        <p className="text-center text-xs text-gray-500 mt-1.5">
          {position.toFixed(1)}% of 52-week range
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Market Cap</p>
          <p className="text-white font-semibold">{formatMarketCap(market_cap, currency)}</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">P/E Ratio</p>
          <p className="text-white font-semibold">{pe_ratio ?? 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
