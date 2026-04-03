# Stock Copilot

A rule-based stock research tool. Enter any ticker and get instant trend analysis, valuation context, and a clear entry recommendation — no AI, no fluff.

---

## Stack

- **Frontend**: Next.js + Tailwind CSS + Recharts
- **Backend**: Python FastAPI
- **Data**: yfinance (Yahoo Finance)

---

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`

> Both must be running at the same time.

---

## How to Use

1. Open `http://localhost:3000` in your browser
2. Type a ticker symbol in the search bar (e.g. `NVDA`, `AMD`, `AAPL`, `MSFT`)
3. Press **Enter** or click **Analyze**
4. Review the four sections:

| Section | What it shows |
|---|---|
| **Stock Overview** | Current price, 52-week range bar, market cap, P/E ratio |
| **Entry Recommendation** | `Enter`, `Wait`, or `Avoid` based on trend + price position |
| **Price Chart** | 6-month closing price history |
| **Trend Analysis** | 50-day & 200-day moving averages with % distance from current price |

---

## How Recommendations Work

### Trend
| Signal | Condition |
|---|---|
| Bullish | Price > 50MA > 200MA |
| Bearish | Price < 50MA < 200MA |
| Sideways | Anything else |

### Entry Signal
| Signal | Condition |
|---|---|
| **Enter** | Bullish trend + price within 20% of 52-week high |
| **Wait** | Bullish but price is extended, or trend is sideways |
| **Avoid** | Bearish trend |

### Valuation (P/E based)
| Label | P/E Range |
|---|---|
| Undervalued | < 15 |
| Fair | 15 – 25 |
| Overvalued | > 25 |
| Unknown | No P/E available (e.g. pre-profit companies) |

---

## Example Tickers to Try

```
NVDA   AAPL   MSFT   AMD   TSLA
META   GOOGL  AMZN   SPY   QQQ
```

---

## API

The backend exposes one endpoint:

```
GET /analyze?ticker=NVDA
```

Returns JSON with price, moving averages, 52-week range, P/E, market cap, trend, valuation, recommendation, and chart data.

---

## Notes

- Data is fetched live from Yahoo Finance on every request — no caching, no database
- Some tickers (ETFs, certain foreign stocks) may not have P/E data — this is expected
- Pre-market/after-hours prices may differ slightly from what Yahoo reports as `currentPrice`
