function pctDiff(price, ma) {
  if (!price || !ma) return null
  return (((price - ma) / ma) * 100).toFixed(2)
}

const trendDescriptions = {
  bullish: 'Price is above both moving averages — uptrend confirmed.',
  bearish: 'Price is below both moving averages — downtrend in effect.',
  sideways: 'Mixed signals — price is between moving averages.',
}

const trendStyles = {
  bullish: { badge: 'bg-green-900/30 text-green-400 border border-green-800', dot: 'bg-green-400' },
  bearish: { badge: 'bg-red-900/30 text-red-400 border border-red-800', dot: 'bg-red-400' },
  sideways: { badge: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800', dot: 'bg-yellow-400' },
}

export default function TrendCard({ data, currency }) {
  const { price, ma50, ma200, trend } = data
  const diff50 = pctDiff(price, ma50)
  const diff200 = pctDiff(price, ma200)
  const styles = trendStyles[trend] || trendStyles.sideways

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Trend Analysis</p>
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${styles.badge}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`} />
          {trend}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/60 rounded-lg p-4">
          <p className="text-gray-500 text-xs mb-1">50-Day MA</p>
          <p className="text-white font-semibold text-lg">{currency}{ma50 ?? 'N/A'}</p>
          {diff50 !== null && (
            <p className={`text-xs mt-1 font-medium ${parseFloat(diff50) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(diff50) >= 0 ? '+' : ''}{diff50}% vs price
            </p>
          )}
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4">
          <p className="text-gray-500 text-xs mb-1">200-Day MA</p>
          <p className="text-white font-semibold text-lg">{currency}{ma200 ?? 'N/A'}</p>
          {diff200 !== null && (
            <p className={`text-xs mt-1 font-medium ${parseFloat(diff200) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(diff200) >= 0 ? '+' : ''}{diff200}% vs price
            </p>
          )}
        </div>
      </div>

      <p className="text-gray-500 text-xs">{trendDescriptions[trend]}</p>
    </div>
  )
}
