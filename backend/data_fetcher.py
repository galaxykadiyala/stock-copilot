import yfinance as yf


def fetch_stock_data(ticker: str) -> dict:
    stock = yf.Ticker(ticker)
    info = stock.info

    price = info.get("currentPrice") or info.get("regularMarketPrice")

    hist = stock.history(period="6mo", interval="1d")
    chart_data = [
        {"date": str(idx.date()), "price": round(float(row["Close"]), 2)}
        for idx, row in hist.iterrows()
    ]
    recent_high = round(float(hist["High"].max()), 2) if not hist.empty else None

    return {
        "name": info.get("longName") or info.get("shortName") or ticker,
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
