import { useState, useEffect } from 'react'

const KEY = 'stock_watchlist'

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState([])

  // Load from localStorage after mount (safe for SSR)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY))
      if (Array.isArray(stored)) setWatchlist(stored)
    } catch {}
  }, [])

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(watchlist))
  }, [watchlist])

  const addTicker = (ticker) => {
    const t = ticker.trim().toUpperCase()
    if (!t) return false
    if (watchlist.includes(t)) return false
    setWatchlist((prev) => [...prev, t])
    return true
  }

  const removeTicker = (ticker) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker))
  }

  return { watchlist, addTicker, removeTicker }
}
