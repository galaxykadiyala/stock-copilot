const CONFIGS = {
  strong: {
    label: 'Strong Dip',
    color: 'text-green-400',
    bg: 'bg-green-950',
    border: 'border-green-800',
    dot: 'bg-green-400',
    desc: 'Price has pulled back into the ideal entry zone (8–20% off recent high) while the uptrend remains intact.',
  },
  weak: {
    label: 'Weak Dip',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950',
    border: 'border-yellow-800',
    dot: 'bg-yellow-400',
    desc: 'Pullback is too shallow (< 8% off recent high). The stock hasn\'t offered a meaningful discount yet.',
  },
  danger: {
    label: 'Danger',
    color: 'text-red-400',
    bg: 'bg-red-950',
    border: 'border-red-800',
    dot: 'bg-red-400',
    desc: 'Either a downtrend is in effect or the pullback exceeds 25% — possible trend breakdown, not a healthy dip.',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-400',
    bg: 'bg-gray-900',
    border: 'border-gray-700',
    dot: 'bg-gray-500',
    desc: 'Insufficient data to classify the dip.',
  },
}

export default function DipSignalCard({ dipType, pullback, recentHigh, currency }) {
  const c = CONFIGS[dipType] || CONFIGS.unknown

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Dip Signal</p>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${c.bg} ${c.border} border ${c.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {c.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Pullback</p>
          <p className={`text-2xl font-black ${c.color}`}>
            {pullback != null ? `-${Math.abs(pullback)}%` : 'N/A'}
          </p>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">6M High</p>
          <p className="text-2xl font-black text-white">
            {recentHigh != null ? `${currency}${recentHigh.toLocaleString()}` : 'N/A'}
          </p>
        </div>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed">{c.desc}</p>
    </div>
  )
}
