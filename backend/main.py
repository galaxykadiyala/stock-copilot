from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from data_fetcher import fetch_stock_data
from analyzer import analyze
from market_trend import fetch_market_trend, market_for_ticker

US_STOCKS = ["AMD", "NVDA", "AAPL", "MSFT"]
INDIA_STOCKS = ["RELIANCE.NS", "TCS.NS", "INFY.NS"]

DIP_ORDER = {"strong": 0, "weak": 1, "danger": 2, "unknown": 3}


def _scan_one(ticker: str, market_trends: dict):
    try:
        raw = fetch_stock_data(ticker)
        if not raw["price"]:
            return None
        market = market_for_ticker(raw["resolved_ticker"])
        mt = market_trends.get(market, {}).get("trend", "unknown")
        signals = analyze(raw, mt)
        return {
            "ticker": raw["resolved_ticker"],
            "name": raw["name"],
            "price": round(raw["price"], 2),
            "currency": raw["currency"],
            "trend": signals["trend"],
            "dip_type": signals["dip_type"],
            "pullback_percentage": signals["pullback_percentage"],
            "recommendation": signals["recommendation"],
            "market_trend": mt,
            "score": signals["score"],
            "score_label": signals["score_label"],
        }
    except Exception:
        return None


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/market-trend")
def market_trend_endpoint():
    with ThreadPoolExecutor(max_workers=2) as pool:
        us_future = pool.submit(fetch_market_trend, "us")
        india_future = pool.submit(fetch_market_trend, "india")
        return {
            "us": us_future.result(),
            "india": india_future.result(),
        }


@app.get("/analyze")
def analyze_ticker(ticker: str):
    try:
        raw = fetch_stock_data(ticker.upper())

        if not raw["price"]:
            raise HTTPException(status_code=404, detail=f"No data found for ticker '{ticker.upper()}'")

        market = market_for_ticker(raw["resolved_ticker"])
        mt_data = fetch_market_trend(market)
        signals = analyze(raw, mt_data["trend"])

        return {
            "ticker": ticker.upper(),
            "resolved_ticker": raw["resolved_ticker"],
            "name": raw["name"],
            "currency": raw["currency"],
            "exchange": raw["exchange"],
            "price": round(raw["price"], 2),
            "high_52w": round(raw["high_52w"], 2) if raw["high_52w"] else None,
            "low_52w": round(raw["low_52w"], 2) if raw["low_52w"] else None,
            "pe_ratio": round(raw["pe"], 2) if raw["pe"] else None,
            "market_cap": raw["market_cap"],
            "ma50": round(raw["ma50"], 2) if raw["ma50"] else None,
            "ma200": round(raw["ma200"], 2) if raw["ma200"] else None,
            "recent_high": raw["recent_high"],
            "buy_zone_low": signals["buy_zone_low"],
            "buy_zone_high": signals["buy_zone_high"],
            "trend": signals["trend"],
            "valuation": signals["valuation"],
            "dip_type": signals["dip_type"],
            "recommendation": signals["recommendation"],
            "pullback_percentage": signals["pullback_percentage"],
            "reason": signals["reason"],
            "chart_data": raw["chart_data"],
            "market_trend": mt_data["trend"],
            "score": signals["score"],
            "score_label": signals["score_label"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/scan")
def scan(market: str = "all"):
    if market == "us":
        tickers = US_STOCKS
        market_trends = {"us": fetch_market_trend("us")}
    elif market == "india":
        tickers = INDIA_STOCKS
        market_trends = {"india": fetch_market_trend("india")}
    else:
        tickers = US_STOCKS + INDIA_STOCKS
        with ThreadPoolExecutor(max_workers=2) as pool:
            us_future = pool.submit(fetch_market_trend, "us")
            india_future = pool.submit(fetch_market_trend, "india")
            market_trends = {
                "us": us_future.result(),
                "india": india_future.result(),
            }

    with ThreadPoolExecutor(max_workers=len(tickers)) as pool:
        futures = [pool.submit(_scan_one, t, market_trends) for t in tickers]
        results = [f.result() for f in futures]

    results = [r for r in results if r is not None]
    results.sort(key=lambda r: DIP_ORDER.get(r["dip_type"], 3))

    return {
        "market_trends": market_trends,
        "stocks": results,
    }
