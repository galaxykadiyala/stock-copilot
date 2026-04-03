def get_trend(price, ma50, ma200) -> str:
    if price and ma50 and ma200:
        if price > ma50 > ma200:
            return "bullish"
        elif price < ma50 < ma200:
            return "bearish"
    return "sideways"


def get_valuation(pe) -> str:
    if pe is None:
        return "unknown"
    if pe < 15:
        return "undervalued"
    elif pe <= 25:
        return "fair"
    return "overvalued"


def get_recommendation(trend, price, high_52w) -> str:
    if trend == "bearish":
        return "Avoid"
    if trend == "bullish" and price and high_52w:
        distance_from_high = (high_52w - price) / high_52w * 100
        # 5–15% below recent high: pulled back enough to offer a better entry,
        # but not so far that the trend may be breaking down.
        if 5 <= distance_from_high <= 15:
            return "Enter"
    return "Wait"


def analyze(raw: dict) -> dict:
    price = raw["price"]
    trend = get_trend(price, raw["ma50"], raw["ma200"])
    valuation = get_valuation(raw["pe"])
    recommendation = get_recommendation(trend, price, raw["high_52w"])
    return {"trend": trend, "valuation": valuation, "recommendation": recommendation}
