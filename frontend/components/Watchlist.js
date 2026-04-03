import { useEffect, useState } from 'react'

const CURRENCY = { INR: '₹', USD: '$' }

const trendColor = (t) => t === 'bullish' ? 'text-green-400' : t === 'bearish' ? 'text-red-400' : 'text-yellow-400'
const dipColor = (d) => d === 'strong' ? 'text-green-400' : d === 'danger' ? 'text-red-400' : 'text-yellow-400'
const recColor = (r) => r === 'Consider Entering' ? 'text-green-400' : r === 'Avoid' ? 'text-red-400' : 'text-yellow-400'

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const aStrong = a.data?.dip_type === 'strong' ? 0 : 1
    const bStrong = b.data?.dip_type === 'strong' ? 0 : 1
    return aStrong - bStrong
  })
}

export default function Watchlist({ watchlist, removeTicker }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!watchlist.length) { setRows([]); return }

    setRows(watchlist.map((ticker) => ({ ticker, loading: true, data: null, error: false })))

    watchlist.forEach((ticker) => {
      fetch(`http://localhost:8000/analyze?ticker=${ticker}`)
        .then((r) => r.json())
        .then((data) =>
          setRows((prev) =>
            sortRows(prev.map((r) => r.ticker === ticker ? { ticker, loading: false, data, error: false } : r))
          )
        )
        .catch(() =>
          setRows((prev) =>
            prev.map((r) => r.ticker === ticker ? { ticker, loading: false, data: null, error: true } : r)
          )
        )
    })
  }, [watchlist])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Watchlist</p>
        <span className="text-gray-600 text-xs">{watchlist.length} stock{watchlist.length !== 1 ? 's' : ''}</span>
      </div>

      {!watchlist.length ? (
        <p className="text-gray-600 text-sm text-center py-10">
          No tickers added yet. Analyze a stock and click "Add to Watchlist".
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left pb-3 font-medium">Ticker</th>
                <th className="text-right pb-3 font-medium">Price</th>
                <th className="text-right pb-3 font-medium">Trend</th>
                <th className="text-right pb-3 font-medium">Dip</th>
                <th className="text-right pb-3 font-medium">Signal</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ ticker, loading, data, error }) => {
                const isStrong = data?.dip_type === 'strong'
                const sym = CURRENCY[data?.currency] ?? '$'
                return (
                  <tr
                    key={ticker}
                    className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                      isStrong ? 'bg-green-950/25' : ''
                    }`}
                  >
                    {/* Ticker + badge */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{ticker}</span>
                        {isStrong && (
                          <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Opportunity
                          </span>
                        )}
                      </div>
                    </td>

                    {loading && (
                      <td colSpan={4} className="py-3 text-right">
                        <span className="text-gray-600 text-xs">Loading...</span>
                      </td>
                    )}

                    {error && (
                      <td colSpan={4} className="py-3 text-right">
                        <span className="text-red-500 text-xs">Failed to load</span>
                      </td>
                    )}

                    {!loading && !error && data && (
                      <>
                        <td className="py-3 text-right text-white font-medium whitespace-nowrap">
                          {sym}{data.price?.toLocaleString()}
                        </td>
                        <td className={`py-3 text-right capitalize font-medium ${trendColor(data.trend)}`}>
                          {data.trend}
                        </td>
                        <td className={`py-3 text-right font-medium ${dipColor(data.dip_type)}`}>
                          {data.pullback_percentage != null ? `-${Math.abs(data.pullback_percentage)}%` : 'N/A'}
                          <span className="ml-1 text-xs opacity-70 capitalize">({data.dip_type})</span>
                        </td>
                        <td className={`py-3 text-right font-medium ${recColor(data.recommendation)}`}>
                          {data.recommendation}
                        </td>
                      </>
                    )}

                    {/* Remove */}
                    <td className="py-3 pl-4 text-right">
                      <button
                        onClick={() => removeTicker(ticker)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-xl leading-none"
                        title="Remove"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
