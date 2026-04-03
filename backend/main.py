from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_trend(price, ma50, ma200):
    if price and ma50 and ma200:
        if price > ma50 > ma200:
            return "bullish"
        elif price < ma50 < ma200:
            return "bearish"
    return "sideways"


def get_valuation(pe):
    if pe is None:
        return "unknown"
    if pe < 15:
        return "undervalued"
    elif pe <= 25:
        return "fair"
    return "overvalued"


def get_recommendation(trend, price, high_52w, low_52w):
    if trend == "bearish":
        return "Avoid"
    if price and high_52w:
        distance_from_high = (high_52w - price) / high_52w * 100
        if trend == "bullish" and distance_from_high <= 20:
            return "Enter"
    return "Wait"


@app.get("/analyze")
def analyze(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        info = stock.info

        price = info.get("currentPrice") or info.get("regularMarketPrice")
        if not price:
            raise HTTPException(status_code=404, detail=f"No data found for ticker '{ticker.upper()}'")

        high_52w = info.get("fiftyTwoWeekHigh")
        low_52w = info.get("fiftyTwoWeekLow")
        pe = info.get("trailingPE")
        market_cap = info.get("marketCap")
        ma50 = info.get("fiftyDayAverage")
        ma200 = info.get("twoHundredDayAverage")
        name = info.get("longName") or info.get("shortName") or ticker.upper()

        trend = get_trend(price, ma50, ma200)
        valuation = get_valuation(pe)
        recommendation = get_recommendation(trend, price, high_52w, low_52w)

        hist = stock.history(period="6mo", interval="1d")
        chart_data = [
            {"date": str(idx.date()), "price": round(float(row["Close"]), 2)}
            for idx, row in hist.iterrows()
        ]

        return {
            "ticker": ticker.upper(),
            "name": name,
            "price": round(price, 2),
            "high_52w": round(high_52w, 2) if high_52w else None,
            "low_52w": round(low_52w, 2) if low_52w else None,
            "pe_ratio": round(pe, 2) if pe else None,
            "market_cap": market_cap,
            "ma50": round(ma50, 2) if ma50 else None,
            "ma200": round(ma200, 2) if ma200 else None,
            "trend": trend,
            "valuation": valuation,
            "recommendation": recommendation,
            "chart_data": chart_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
