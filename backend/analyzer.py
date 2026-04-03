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


def get_dip_type(trend, pullback) -> str:
    if pullback is None:
        return "unknown"
    if trend == "bearish" or pullback > 25:
        return "danger"
    if trend == "bullish" and 8 <= pullback <= 20:
        return "strong"
    if trend == "bullish" and pullback < 8:
        return "weak"
    return "danger"


def get_recommendation(dip_type) -> str:
    return {
        "strong":  "Consider Entering",
        "weak":    "Wait for Deeper Pullback",
        "danger":  "Avoid",
        "unknown": "Insufficient Data",
    }.get(dip_type, "Avoid")


def get_buy_zone(recent_high, ma50) -> tuple:
    if not recent_high:
        return None, None
    # Entry zone: 8–20% below recent high (aligned with strong dip range)
    zone_high = round(recent_high * 0.92, 2)
    zone_low = round(recent_high * 0.80, 2)
    # If ma50 sits inside the zone, use it as the support floor
    if ma50 and zone_low <= ma50 <= zone_high:
        zone_low = round(ma50, 2)
    return zone_low, zone_high


def get_reason(trend, dip_type, recommendation, valuation, price, ma50, ma200, recent_high, pullback) -> str:
    valuation_note = {
        "undervalued": "undervalued on PE",
        "fair":        "fairly valued on PE",
        "overvalued":  "overvalued on PE",
        "unknown":     "PE not available",
    }.get(valuation, "")

    if dip_type == "strong":
        return (
            f"Uptrend intact — price above 50MA ({ma50}) and 200MA ({ma200}). "
            f"Pulled back {pullback}% from the 6-month high ({recent_high}), a strong dip within the trend. "
            f"Stock is {valuation_note}."
        )
    if dip_type == "weak":
        return (
            f"Uptrend intact, but only {pullback}% off the 6-month high ({recent_high}) — not a deep enough pullback. "
            f"Stock is {valuation_note}. Wait for the 8–20% zone before entering."
        )
    if dip_type == "danger":
        if trend == "bearish":
            return (
                f"Downtrend in effect — price below 50MA ({ma50}) and 200MA ({ma200}). "
                f"{'Stock is ' + valuation_note + ', but ' if valuation != 'unknown' else ''}"
                f"trend risk outweighs any valuation case."
            )
        return (
            f"Pullback of {pullback}% exceeds 25% — potential trend breakdown, not a healthy dip. "
            f"Stock is {valuation_note}. Wait for stabilisation before re-evaluating."
        )
    return f"Insufficient data to assess trend or pullback. Stock is {valuation_note}."


def analyze(raw: dict) -> dict:
    price = raw["price"]
    ma50 = round(raw["ma50"], 2) if raw["ma50"] else None
    ma200 = round(raw["ma200"], 2) if raw["ma200"] else None
    recent_high = raw["recent_high"]

    pullback = round((recent_high - price) / recent_high * 100, 1) if recent_high else None

    trend = get_trend(price, ma50, ma200)
    valuation = get_valuation(raw["pe"])
    dip_type = get_dip_type(trend, pullback)
    recommendation = get_recommendation(dip_type)
    reason = get_reason(trend, dip_type, recommendation, valuation, price, ma50, ma200, recent_high, pullback)
    buy_zone_low, buy_zone_high = get_buy_zone(recent_high, ma50)

    return {
        "trend": trend,
        "valuation": valuation,
        "dip_type": dip_type,
        "recommendation": recommendation,
        "reason": reason,
        "pullback_percentage": pullback,
        "buy_zone_low": buy_zone_low,
        "buy_zone_high": buy_zone_high,
    }
