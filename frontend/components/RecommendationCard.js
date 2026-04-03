const CONFIGS = {
  'Consider Entering': {
    label: 'Consider Entering',
    icon: '↑',
    colorText: 'text-green-400',
    colorBg: 'bg-green-950',
    colorBorder: 'border-green-800',
    desc: 'Strong dip in a bullish trend — pullback is in the ideal entry zone.',
  },
  'Wait for Deeper Pullback': {
    label: 'Wait',
    icon: '→',
    colorText: 'text-yellow-400',
    colorBg: 'bg-yellow-950',
    colorBorder: 'border-yellow-800',
    desc: 'Uptrend intact but pullback is too shallow. Wait for the 8–20% dip zone.',
  },
  Avoid: {
    label: 'Avoid',
    icon: '↓',
    colorText: 'text-red-400',
    colorBg: 'bg-red-950',
    colorBorder: 'border-red-800',
    desc: 'Downtrend detected. High risk of further downside.',
  },
}

const trendColor = (trend) => {
  if (trend === 'bullish') return 'text-green-400'
  if (trend === 'bearish') return 'text-red-400'
  return 'text-yellow-400'
}

const valuationColor = (val) => {
  if (val === 'undervalued') return 'text-green-400'
  if (val === 'overvalued') return 'text-red-400'
  if (val === 'fair') return 'text-blue-400'
  return 'text-gray-400'
}

export default function RecommendationCard({ recommendation, trend, valuation, exchange }) {
  const c = CONFIGS[recommendation] || CONFIGS.Wait

  return (
    <div className={`${c.colorBg} border ${c.colorBorder} rounded-xl p-6 flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Entry Recommendation</p>
        {exchange && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{exchange}</span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
        <span className={`text-6xl mb-1 ${c.colorText}`}>{c.icon}</span>
        <h2 className={`text-5xl font-black mb-3 ${c.colorText}`}>{c.label}</h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">{c.desc}</p>
      </div>

      <div className="border-t border-gray-800 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trend</span>
          <span className={`font-medium capitalize ${trendColor(trend)}`}>{trend}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Valuation</span>
          <span className={`font-medium capitalize ${valuationColor(valuation)}`}>{valuation}</span>
        </div>
      </div>
    </div>
  )
}
