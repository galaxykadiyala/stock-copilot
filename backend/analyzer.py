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


def get_reason(trend, recommendation, valuation, price, ma50, ma200, high_52w) -> str:
    valuation_note = {
        "undervalued": "undervalued on PE",
        "fair": "fairly valued on PE",
        "overvalued": "overvalued on PE",
        "unknown": "PE not available",
    }.get(valuation, "")

    distance = round((high_52w - price) / high_52w * 100, 1) if high_52w else None

    if recommendation == "Enter":
        return (
            f"Uptrend confirmed — price above 50MA (${ma50}) and 200MA (${ma200}). "
            f"Pulled back {distance}% from the 52-week high (${high_52w}), offering a better entry. "
            f"Stock is {valuation_note}."
        )
    if recommendation == "Avoid":
        return (
            f"Downtrend in effect — price below 50MA (${ma50}) and 200MA (${ma200}). "
            f"{'Stock is ' + valuation_note + ', but ' if valuation != 'unknown' else ''}"
            f"trend risk outweighs any valuation case."
        )
    # Wait
    if trend == "bullish" and distance is not None:
        if distance < 5:
            return (
                f"Uptrend intact, but price is only {distance}% below the 52-week high (${high_52w}) — too extended. "
                f"Stock is {valuation_note}. Wait for a pullback."
            )
        return (
            f"Uptrend intact but price is {distance}% off the 52-week high (${high_52w}) — pullback may continue. "
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
    high_52w = round(raw["high_52w"], 2) if raw["high_52w"] else None

    trend = get_trend(price, ma50, ma200)
    valuation = get_valuation(raw["pe"])
    recommendation = get_recommendation(trend, price, high_52w)
    reason = get_reason(trend, recommendation, valuation, price, ma50, ma200, high_52w)

    return {"trend": trend, "valuation": valuation, "recommendation": recommendation, "reason": reason}
