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


def get_reason(trend, recommendation, price, ma50, ma200, high_52w) -> str:
    if trend == "bullish":
        trend_reason = f"Price (${price}) is above the 50-day (${ma50}) and 200-day (${ma200}) MAs, confirming an uptrend."
    elif trend == "bearish":
        trend_reason = f"Price (${price}) is below the 50-day (${ma50}) and 200-day (${ma200}) MAs, confirming a downtrend."
    else:
        trend_reason = f"Price (${price}) is between the 50-day (${ma50}) and 200-day (${ma200}) MAs — no clear direction."

    if recommendation == "Enter":
        distance = round((high_52w - price) / high_52w * 100, 1)
        rec_reason = f"Price is {distance}% below the 52-week high (${high_52w}), suggesting a healthy pullback entry."
    elif recommendation == "Avoid":
        rec_reason = "Downtrend in effect — risk of further downside outweighs potential reward."
    else:
        if trend == "bullish" and high_52w:
            distance = round((high_52w - price) / high_52w * 100, 1)
            if distance < 5:
                rec_reason = f"Price is within {distance}% of the 52-week high — too extended for a low-risk entry."
            else:
                rec_reason = f"Price is {distance}% off the 52-week high — pullback may still be in progress."
        else:
            rec_reason = "Mixed trend signals — wait for clearer momentum before entering."

    return f"{trend_reason} {rec_reason}"


def analyze(raw: dict) -> dict:
    price = raw["price"]
    ma50 = round(raw["ma50"], 2) if raw["ma50"] else None
    ma200 = round(raw["ma200"], 2) if raw["ma200"] else None
    high_52w = round(raw["high_52w"], 2) if raw["high_52w"] else None

    trend = get_trend(price, ma50, ma200)
    valuation = get_valuation(raw["pe"])
    recommendation = get_recommendation(trend, price, high_52w)
    reason = get_reason(trend, recommendation, price, ma50, ma200, high_52w)

    return {"trend": trend, "valuation": valuation, "recommendation": recommendation, "reason": reason}
