import { useState, useRef } from "react";
import Link from "next/link";

const ACTION_COLORS = {
  ADD:    "text-green-400 bg-green-900/40 border border-green-700",
  HOLD:   "text-yellow-400 bg-yellow-900/40 border border-yellow-700",
  REDUCE: "text-orange-400 bg-orange-900/40 border border-orange-700",
  EXIT:   "text-red-400 bg-red-900/40 border border-red-700",
};

const CONFIDENCE_COLORS = {
  high:   "text-green-400",
  medium: "text-yellow-400",
  low:    "text-red-400",
};

const RISK_COLORS = {
  balanced:     "text-green-400",
  concentrated: "text-yellow-400",
  high:         "text-red-400",
};

const TREND_COLORS = {
  bullish:  "text-green-400",
  bearish:  "text-red-400",
  sideways: "text-yellow-400",
};

const STEPS = [
  "Fetching market trends...",
  "Analyzing your stocks...",
  "Running AI portfolio review...",
  "Done",
];

export default function Portfolio() {
  const [holdings, setHoldings]       = useState([]);
  const [form, setForm]               = useState({ ticker: "", quantity: "", avg_price: "" });
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [step, setStep]               = useState(0);
  const [error, setError]             = useState("");
  const [formError, setFormError]     = useState("");
  const [parsing, setParsing]         = useState(false);
  const [parseError, setParseError]   = useState("");
  const fileRef = useRef(null);

  // ── Holdings management ────────────────────────────────────────────────────

  function addHolding() {
    const ticker    = form.ticker.trim().toUpperCase();
    const quantity  = parseFloat(form.quantity);
    const avg_price = parseFloat(form.avg_price);
    if (!ticker || isNaN(quantity) || isNaN(avg_price) || quantity <= 0 || avg_price <= 0) {
      setFormError("Please fill all fields with valid values.");
      return;
    }
    if (holdings.some((h) => h.ticker === ticker)) {
      setFormError(`${ticker} is already in your portfolio.`);
      return;
    }
    setHoldings([...holdings, { ticker, quantity, avg_price }]);
    setForm({ ticker: "", quantity: "", avg_price: "" });
    setFormError("");
  }

  function removeHolding(ticker) {
    setHoldings(holdings.filter((h) => h.ticker !== ticker));
  }

  // ── Screenshot upload ──────────────────────────────────────────────────────

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("http://localhost:8000/parse-portfolio-image", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to parse image");
      }
      const data = await res.json();
      const parsed = data.holdings || [];
      if (parsed.length === 0) {
        setParseError("No holdings detected in the screenshot. Try a clearer image.");
        return;
      }
      // Merge with existing, skip duplicates
      const newItems = parsed.filter(
        (p) => !holdings.some((h) => h.ticker === p.ticker.toUpperCase())
      ).map((p) => ({
        ticker:    p.ticker.toUpperCase(),
        quantity:  parseFloat(p.quantity),
        avg_price: parseFloat(p.avg_price),
      }));
      setHoldings((prev) => [...prev, ...newItems]);
      if (newItems.length < parsed.length) {
        setParseError(`${parsed.length - newItems.length} duplicate(s) skipped.`);
      }
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  // ── Analysis ───────────────────────────────────────────────────────────────

  async function analyze() {
    if (holdings.length === 0) {
      setError("Add at least one holding first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setStep(0);

    const controller = new AbortController();
    const hardTimeout = setTimeout(() => controller.abort(), 90000); // 90s max

    // Step progression: 0→1 after 8s, 1→2 after 16s, stays at 2
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 2));
    }, 8000);

    try {
      const res = await fetch("http://localhost:8000/analyze-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holdings),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setStep(STEPS.length - 1);
      setResult(data);
    } catch (e) {
      if (e.name === "AbortError") {
        setError("Request timed out after 90 seconds. Try with fewer stocks or check your OPENAI_API_KEY.");
      } else {
        setError(e.message);
      }
    } finally {
      clearInterval(stepTimer);
      clearTimeout(hardTimeout);
      setLoading(false);
    }
  }

  function getAI(ticker) {
    return result?.ai?.stock_actions?.find((a) => a.ticker === ticker) || null;
  }

  const insights  = result?.ai?.portfolio_insights;
  const allocAdv  = result?.ai?.allocation_advice;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Portfolio Analyzer{" "}
              <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-1 rounded ml-2 align-middle">PRO</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm">AI-powered advice for 2–5x growth over 5 years</p>
          </div>
          <div className="flex gap-4 mt-1">
            <Link href="/"        className="text-gray-400 hover:text-white text-sm transition-colors">← Copilot</Link>
            <Link href="/scanner" className="text-gray-400 hover:text-white text-sm transition-colors">Scanner →</Link>
          </div>
        </div>

        {/* Input panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">

          {/* Screenshot upload */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Upload portfolio screenshot</p>
            <div
              className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors relative"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-blue-400 text-sm">Reading screenshot with AI...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
                  </svg>
                  <p className="text-sm">Click to upload a screenshot — AI will extract your holdings</p>
                  <p className="text-xs text-gray-600">Supports broker screenshots, spreadsheet exports, etc.</p>
                </div>
              )}
            </div>
            {parseError && <p className="mt-2 text-yellow-400 text-xs">{parseError}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-xs text-gray-500">or add manually</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Manual input */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Ticker</label>
              <input
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white w-32 focus:outline-none focus:border-blue-500 uppercase"
                placeholder="NVDA"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Quantity</label>
              <input
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white w-28 focus:outline-none focus:border-blue-500"
                placeholder="10"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Avg Buy Price</label>
              <input
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white w-36 focus:outline-none focus:border-blue-500"
                placeholder="500.00"
                type="number"
                min="0"
                step="0.01"
                value={form.avg_price}
                onChange={(e) => setForm({ ...form, avg_price: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
              />
            </div>
            <button
              onClick={addHolding}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add
            </button>
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}

          {/* Holdings list */}
          {holdings.length > 0 && (
            <div className="space-y-2">
              {holdings.map((h) => (
                <div key={h.ticker} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
                  <span className="font-mono font-semibold text-blue-400 w-24">{h.ticker}</span>
                  <span className="text-gray-400 text-sm">{h.quantity} shares</span>
                  <span className="text-gray-400 text-sm">@ ${h.avg_price.toLocaleString()}</span>
                  <button
                    onClick={() => removeHolding(h.ticker)}
                    className="text-gray-600 hover:text-red-400 text-sm transition-colors ml-4"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={analyze}
            disabled={loading || holdings.length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
          >
            {loading ? "Analyzing..." : `Analyze Portfolio (${holdings.length} stock${holdings.length !== 1 ? "s" : ""})`}
          </button>
        </div>

        {/* Step progress */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex flex-col gap-3">
              {STEPS.slice(0, -1).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i < step ? (
                    <span className="text-green-500 w-5 text-center">✓</span>
                  ) : i === step ? (
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  ) : (
                    <span className="text-gray-700 w-5 text-center">○</span>
                  )}
                  <span className={`text-sm ${i === step ? "text-blue-400 font-medium" : i < step ? "text-green-500" : "text-gray-600"}`}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Failed tickers warning */}
            {result.failed?.length > 0 && (
              <div className="bg-yellow-950 border border-yellow-800 rounded-lg px-4 py-3 text-yellow-300 text-sm">
                Could not fetch data for: {result.failed.map((f) => f.ticker).join(", ")}
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Portfolio Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-white">${result.total_value.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Market Trend</p>
                  <p className={`text-xl font-bold capitalize ${TREND_COLORS[result.market_trend] || "text-gray-300"}`}>
                    {result.market_trend}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Concentration Risk</p>
                  <p className={`text-xl font-bold capitalize ${RISK_COLORS[result.risk_level] || "text-gray-300"}`}>
                    {result.risk_level}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Top Holdings</p>
                  <div className="space-y-1">
                    {result.top_holdings.map((h) => (
                      <div key={h.ticker} className="flex justify-between text-sm">
                        <span className="font-mono text-blue-400">{h.ticker}</span>
                        <span className="text-gray-300">{h.allocation_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {result.risk_level !== "balanced" && (
                <div className="mt-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
                  ⚠{" "}
                  {result.risk_level === "high"
                    ? "A single position exceeds 30% of your portfolio — high concentration risk."
                    : "Your top 3 holdings exceed 60% of your portfolio — consider diversifying."}
                </div>
              )}
            </div>

            {/* Holdings Table */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Holdings Analysis</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
                      <th className="text-left py-2 pr-4">Ticker</th>
                      <th className="text-right pr-4">Price</th>
                      <th className="text-right pr-4">Alloc %</th>
                      <th className="text-right pr-4">P&L %</th>
                      <th className="text-left pr-4">Trend</th>
                      <th className="text-left pr-4">Score</th>
                      <th className="text-left pr-4">Action</th>
                      <th className="text-left pr-4">Confidence</th>
                      <th className="text-left">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {result.stocks.map((s) => {
                      const ai = getAI(s.ticker);
                      const plColor  = s.profit_loss_pct >= 0 ? "text-green-400" : "text-red-400";
                      const rowBg =
                        ai?.action === "ADD"                              ? "bg-green-950/20"
                        : ai?.action === "EXIT" || ai?.action === "REDUCE" ? "bg-red-950/20"
                        : "";
                      return (
                        <tr key={s.ticker} className={`${rowBg} hover:bg-gray-800/40 transition-colors`}>
                          <td className="py-3 pr-4">
                            <span className="font-mono font-semibold text-blue-400">{s.ticker}</span>
                            <p className="text-gray-500 text-xs truncate max-w-[120px]">{s.name}</p>
                          </td>
                          <td className="text-right pr-4 font-mono text-gray-200">
                            {s.currency === "INR" ? "₹" : "$"}{s.current_price.toLocaleString()}
                          </td>
                          <td className="text-right pr-4 text-gray-300">{s.allocation_pct}%</td>
                          <td className={`text-right pr-4 font-semibold ${plColor}`}>
                            {s.profit_loss_pct >= 0 ? "+" : ""}{s.profit_loss_pct}%
                          </td>
                          <td className={`pr-4 capitalize font-medium ${TREND_COLORS[s.trend] || "text-gray-400"}`}>
                            {s.trend}
                          </td>
                          <td className="pr-4 text-gray-300">{s.score}</td>
                          <td className="pr-4">
                            {ai
                              ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[ai.action] || "text-gray-400"}`}>{ai.action}</span>
                              : <span className="text-gray-600">—</span>}
                          </td>
                          <td className={`pr-4 capitalize text-xs font-medium ${ai ? CONFIDENCE_COLORS[ai.confidence] : "text-gray-600"}`}>
                            {ai?.confidence || "—"}
                          </td>
                          <td className="text-gray-400 text-xs max-w-xs">
                            {ai?.reasoning || "—"}
                            {ai?.better_action_price && (
                              <span className="block text-blue-400 mt-0.5">
                                Better entry: ${ai.better_action_price}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights + Allocation */}
            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-200">Portfolio Insights</h2>
                  {insights.biggest_risks?.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 uppercase font-semibold mb-1">Biggest Risks</p>
                      <ul className="space-y-1">
                        {insights.biggest_risks.map((r, i) => (
                          <li key={i} className="text-gray-300 text-sm flex gap-2">
                            <span className="text-red-500 shrink-0">▸</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.overexposed_positions?.length > 0 && (
                    <div>
                      <p className="text-xs text-orange-400 uppercase font-semibold mb-1">Overexposed</p>
                      <div className="flex flex-wrap gap-2">
                        {insights.overexposed_positions.map((t) => (
                          <span key={t} className="bg-orange-900/40 border border-orange-700 text-orange-300 text-xs px-2 py-1 rounded font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-200">Allocation Advice</h2>
                  {(allocAdv?.increase?.length > 0 || insights.strong_stocks_to_add?.length > 0) && (
                    <div>
                      <p className="text-xs text-green-400 uppercase font-semibold mb-1">Add / Increase</p>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set([...(allocAdv?.increase || []), ...(insights.strong_stocks_to_add || [])])].map((t) => (
                          <span key={t} className="bg-green-900/40 border border-green-700 text-green-300 text-xs px-2 py-1 rounded font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(allocAdv?.decrease?.length > 0 || insights.weak_stocks_to_reduce?.length > 0) && (
                    <div>
                      <p className="text-xs text-red-400 uppercase font-semibold mb-1">Reduce / Exit</p>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set([...(allocAdv?.decrease || []), ...(insights.weak_stocks_to_reduce || [])])].map((t) => (
                          <span key={t} className="bg-red-900/40 border border-red-700 text-red-300 text-xs px-2 py-1 rounded font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
