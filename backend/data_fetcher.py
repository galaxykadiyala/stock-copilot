import yfinance as yf


def resolve_ticker(ticker: str) -> str:
    """
    If ticker has no suffix (e.g. RELIANCE), try appending .NS first.
    Falls back to the original ticker if .NS yields no price data.
    Tickers that already contain '.' (e.g. RELIANCE.NS, BRK.B) are used as-is.
    """
    if "." in ticker:
        return ticker

    ns_ticker = ticker + ".NS"
    info = yf.Ticker(ns_ticker).info
    if info.get("currentPrice") or info.get("regularMarketPrice"):
        return ns_ticker

    return ticker


def fetch_stock_data(ticker: str) -> dict:
    resolved = resolve_ticker(ticker)
    stock = yf.Ticker(resolved)
    info = stock.info

    price = info.get("currentPrice") or info.get("regularMarketPrice")

    hist = stock.history(period="6mo", interval="1d")
    chart_data = [
        {"date": str(idx.date()), "price": round(float(row["Close"]), 2)}
        for idx, row in hist.iterrows()
    ]
    recent_high = round(float(hist["High"].max()), 2) if not hist.empty else None

    return {
        "resolved_ticker": resolved,
        "name": info.get("longName") or info.get("shortName") or resolved,
        "currency": info.get("currency", "USD"),
        "exchange": info.get("fullExchangeName") or info.get("exchange") or "N/A",
        "price": price,
        "high_52w": info.get("fiftyTwoWeekHigh"),
        "low_52w": info.get("fiftyTwoWeekLow"),
        "recent_high": recent_high,
        "pe": info.get("trailingPE"),
        "market_cap": info.get("marketCap"),
        "ma50": info.get("fiftyDayAverage"),
        "ma200": info.get("twoHundredDayAverage"),
        "chart_data": chart_data,
    }
