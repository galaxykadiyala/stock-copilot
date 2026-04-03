import yfinance as yf

MARKET_INDICES = {
    "us": "^GSPC",
    "india": "^NSEI",
}


def fetch_market_trend(market: str) -> dict:
    ticker = MARKET_INDICES.get(market)
    if not ticker:
        return {"trend": "unknown", "price": None, "ma50": None, "ma200": None}

    hist = yf.Ticker(ticker).history(period="1y", interval="1d")
    if hist.empty or len(hist) < 50:
        return {"trend": "unknown", "price": None, "ma50": None, "ma200": None}

    closes = hist["Close"]
    price = round(float(closes.iloc[-1]), 2)
    ma50 = round(float(closes.tail(50).mean()), 2)
    ma200 = round(float(closes.tail(200).mean()), 2) if len(closes) >= 200 else None

    if ma200 and price > ma50 > ma200:
        trend = "bullish"
    elif ma200 and price < ma50 < ma200:
        trend = "bearish"
    else:
        trend = "sideways"

    return {"trend": trend, "price": price, "ma50": ma50, "ma200": ma200}


def market_for_ticker(ticker: str) -> str:
    return "india" if ticker.endswith(".NS") else "us"
