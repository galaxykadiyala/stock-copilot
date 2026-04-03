from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data_fetcher import fetch_stock_data
from analyzer import analyze

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/analyze")
def analyze_ticker(ticker: str):
    try:
        raw = fetch_stock_data(ticker.upper())

        if not raw["price"]:
            raise HTTPException(status_code=404, detail=f"No data found for ticker '{ticker.upper()}'")

        signals = analyze(raw)

        return {
            "ticker": ticker.upper(),
            "name": raw["name"],
            "price": round(raw["price"], 2),
            "high_52w": round(raw["high_52w"], 2) if raw["high_52w"] else None,
            "low_52w": round(raw["low_52w"], 2) if raw["low_52w"] else None,
            "pe_ratio": round(raw["pe"], 2) if raw["pe"] else None,
            "market_cap": raw["market_cap"],
            "ma50": round(raw["ma50"], 2) if raw["ma50"] else None,
            "ma200": round(raw["ma200"], 2) if raw["ma200"] else None,
            "trend": signals["trend"],
            "valuation": signals["valuation"],
            "recommendation": signals["recommendation"],
            "chart_data": raw["chart_data"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
