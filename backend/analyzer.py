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


def get_buy_zone(recent_high, ma50) -> tuple:
    if not recent_high:
        return None, None
    # Entry zone: 5–15% below recent high
    zone_high = round(recent_high * 0.95, 2)
    zone_low = round(recent_high * 0.85, 2)
    # If ma50 sits inside the zone, use it as the support floor (stronger level)
    if ma50 and zone_low <= ma50 <= zone_high:
        zone_low = round(ma50, 2)
    return zone_low, zone_high


def get_recommendation(trend, price, recent_high) -> str:
    if trend == "bearish":
        return "Avoid"
    if trend == "bullish" and price and recent_high:
        pullback = (recent_high - price) / recent_high * 100
        # 5–15% below recent high: pulled back enough to offer a better entry,
        # but not so far that the trend may be breaking down.
        if 5 <= pullback <= 15:
            return "Enter"
    return "Wait"


def get_reason(trend, recommendation, valuation, price, ma50, ma200, recent_high, pullback) -> str:
    valuation_note = {
        "undervalued": "undervalued on PE",
        "fair": "fairly valued on PE",
        "overvalued": "overvalued on PE",
        "unknown": "PE not available",
    }.get(valuation, "")

    if recommendation == "Enter":
        return (
            f"Uptrend confirmed — price above 50MA (${ma50}) and 200MA (${ma200}). "
            f"Down {pullback}% from the 6-month high (${recent_high}), a healthy pullback zone. "
            f"Stock is {valuation_note}."
        )
    if recommendation == "Avoid":
        return (
            f"Downtrend in effect — price below 50MA (${ma50}) and 200MA (${ma200}). "
            f"{'Stock is ' + valuation_note + ', but ' if valuation != 'unknown' else ''}"
            f"trend risk outweighs any valuation case."
        )
    # Wait
    if trend == "bullish" and pullback is not None:
        if pullback < 5:
            return (
                f"Uptrend intact, but only {pullback}% off the 6-month high (${recent_high}) — too extended for a safe entry. "
                f"Stock is {valuation_note}. Wait for a pullback."
            )
        return (
            f"Uptrend intact but {pullback}% off the 6-month high (${recent_high}) — pullback may still be in progress. "
            f"Stock is {valuation_note}. Hold off for now."
        )
    return (
        f"Price (${price}) is between 50MA (${ma50}) and 200MA (${ma200}) — no clear trend. "
        f"Stock is {valuation_note}. Wait for momentum to establish."
    )


def analyze(raw: dict) -> dict:
    price = raw["price"]
    ma50 = round(raw["ma50"], 2) if raw["ma50"] else None
    ma200 = round(raw["ma200"], 2) if raw["ma200"] else None
    recent_high = raw["recent_high"]

    pullback = round((recent_high - price) / recent_high * 100, 1) if recent_high else None

    trend = get_trend(price, ma50, ma200)
    valuation = get_valuation(raw["pe"])
    recommendation = get_recommendation(trend, price, recent_high)
    reason = get_reason(trend, recommendation, valuation, price, ma50, ma200, recent_high, pullback)

    buy_zone_low, buy_zone_high = get_buy_zone(recent_high, ma50)

    return {
        "trend": trend,
        "valuation": valuation,
        "recommendation": recommendation,
        "reason": reason,
        "pullback_percentage": pullback,
        "buy_zone_low": buy_zone_low,
        "buy_zone_high": buy_zone_high,
    }
