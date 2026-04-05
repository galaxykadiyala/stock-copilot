import os
import json
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
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
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PortfolioItem(BaseModel):
    ticker: str
    quantity: float
    avg_price: float


def _enrich_one(item: PortfolioItem, market_trends: dict):
    try:
        raw = fetch_stock_data(item.ticker.upper())
        if not raw or not raw.get("price"):
            return {"ticker": item.ticker.upper(), "error": "No price data"}
        market = market_for_ticker(raw["resolved_ticker"])
        mt = market_trends.get(market, {}).get("trend", "unknown")
        signals = analyze(raw, mt)
        price = raw["price"]
        invested = round(item.quantity * item.avg_price, 2)
        current = round(item.quantity * price, 2)
        pl_pct = round((price - item.avg_price) / item.avg_price * 100, 2)
        return {
            "ticker": raw["resolved_ticker"],
            "name": raw["name"],
            "currency": raw["currency"],
            "quantity": item.quantity,
            "avg_price": item.avg_price,
            "current_price": round(price, 2),
            "invested_value": invested,
            "current_value": current,
            "profit_loss_pct": pl_pct,
            "trend": signals["trend"],
            "valuation": signals["valuation"],
            "dip_type": signals["dip_type"],
            "score": signals["score"],
            "score_label": signals["score_label"],
        }
    except Exception as e:
        return {"ticker": item.ticker.upper(), "error": str(e)}


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


@app.post("/parse-portfolio-image")
async def parse_portfolio_image(file: UploadFile = File(...)):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    mime = file.content_type or "image/png"

    prompt = """Extract all stock holdings from this portfolio screenshot.
Return ONLY valid JSON in this exact structure, no extra text:
{
  "holdings": [
    {"ticker": "AAPL", "quantity": 10, "avg_price": 150.00}
  ]
}
Rules:
- ticker: stock symbol (uppercase, e.g. AAPL, RELIANCE.NS)
- quantity: number of shares (numeric)
- avg_price: average buy/cost price per share (numeric)
- If avg_price is not visible, use current price instead
- Skip any row where ticker or quantity is unclear
- For Indian stocks, append .NS if not already present"""

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                ],
            }],
            temperature=0,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")


@app.post("/analyze-portfolio")
def analyze_portfolio(portfolio: List[PortfolioItem]):
    if not portfolio:
        raise HTTPException(status_code=400, detail="Portfolio is empty")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    # Step 1: Fetch market trends (resilient — India failure won't block)
    def _safe_trend(market):
        try:
            return fetch_market_trend(market)
        except Exception:
            return {"trend": "unknown"}

    with ThreadPoolExecutor(max_workers=2) as pool:
        us_f = pool.submit(_safe_trend, "us")
        in_f = pool.submit(_safe_trend, "india")
        market_trends = {"us": us_f.result(), "india": in_f.result()}

    overall_market = market_trends["us"].get("trend", "unknown")

    # Step 2: Enrich each stock in parallel
    with ThreadPoolExecutor(max_workers=len(portfolio)) as pool:
        futures = [pool.submit(_enrich_one, item, market_trends) for item in portfolio]
        enriched = [f.result() for f in futures]

    failed = [e for e in enriched if e and "error" in e]
    enriched = [e for e in enriched if e and "error" not in e]
    if not enriched:
        raise HTTPException(status_code=422, detail="Could not fetch data for any ticker")

    # Step 3: Portfolio metrics
    total_value = sum(e["current_value"] for e in enriched)
    for e in enriched:
        e["allocation_pct"] = round(e["current_value"] / total_value * 100, 2) if total_value else 0

    sorted_by_alloc = sorted(enriched, key=lambda x: x["allocation_pct"], reverse=True)
    top3_pct = sum(s["allocation_pct"] for s in sorted_by_alloc[:3])
    max_alloc = sorted_by_alloc[0]["allocation_pct"] if sorted_by_alloc else 0

    if max_alloc > 30:
        risk_level = "high"
    elif top3_pct > 60:
        risk_level = "concentrated"
    else:
        risk_level = "balanced"

    top_holdings = [{"ticker": s["ticker"], "allocation_pct": s["allocation_pct"]} for s in sorted_by_alloc[:3]]

    # Step 4: Build OpenAI prompt
    portfolio_lines = []
    for e in enriched:
        portfolio_lines.append(
            f"- {e['ticker']}: allocation={e['allocation_pct']}%, P&L={e['profit_loss_pct']}%, "
            f"trend={e['trend']}, valuation={e['valuation']}, dip={e['dip_type']}, score={e['score']}"
        )
    portfolio_data = "\n".join(portfolio_lines)

    prompt = f"""You are a disciplined long-term investor and portfolio manager.

Goal:
Optimize this portfolio for 2–5x growth over 5 years.

Principles:
- Focus on strong trends and scalable businesses
- Avoid overconcentration
- Reduce exposure to weak or overvalued stocks
- Prefer adding during dips in strong trends

Market Trend: {overall_market}

Portfolio Summary:
- total_value: {round(total_value, 2)}
- concentration_risk: {risk_level}

Portfolio Data:
{portfolio_data}

Each stock includes: ticker, allocation %, profit_loss %, trend, valuation, dip_type, score.

Tasks:
1. For EACH stock return: action (HOLD/ADD/REDUCE/EXIT), confidence (high/medium/low), reasoning (specific, not generic), better_action_price (number or null).
2. Portfolio-level insights: biggest_risks (list), overexposed_positions (list of tickers), weak_stocks_to_reduce (list), strong_stocks_to_add (list).
3. Allocation advice: increase (list of tickers), decrease (list of tickers).

Respond ONLY with valid JSON in this exact structure:
{{
  "stock_actions": [
    {{"ticker": "X", "action": "HOLD", "confidence": "high", "reasoning": "...", "better_action_price": null}}
  ],
  "portfolio_insights": {{
    "biggest_risks": ["..."],
    "overexposed_positions": ["..."],
    "weak_stocks_to_reduce": ["..."],
    "strong_stocks_to_add": ["..."]
  }},
  "allocation_advice": {{
    "increase": ["..."],
    "decrease": ["..."]
  }}
}}"""

    # Step 5: Call OpenAI (hard 45s timeout)
    try:
        client = OpenAI(api_key=api_key, timeout=45.0)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        ai_result = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")

    return {
        "market_trend": overall_market,
        "total_value": round(total_value, 2),
        "risk_level": risk_level,
        "top_holdings": top_holdings,
        "stocks": enriched,
        "failed": failed,
        "ai": ai_result,
    }
