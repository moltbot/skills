#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "yfinance>=0.2.40",
#     "pandas>=2.0.0",
#     "fear-and-greed>=0.4",
#     "edgartools>=2.0.0",
# ]
# ///
"""
Stock analysis using Yahoo Finance data.

Usage:
    uv run analyze_stock.py TICKER [TICKER2 ...] [--output text|json] [--verbose]
"""

import argparse
import json
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Literal

import pandas as pd
import yfinance as yf


@dataclass
class StockData:
    ticker: str
    info: dict
    earnings_history: pd.DataFrame | None
    analyst_info: dict | None
    price_history: pd.DataFrame | None


@dataclass
class EarningsSurprise:
    score: float
    explanation: str
    actual_eps: float | None = None
    expected_eps: float | None = None
    surprise_pct: float | None = None


@dataclass
class Fundamentals:
    score: float
    key_metrics: dict
    explanation: str


@dataclass
class AnalystSentiment:
    score: float | None
    summary: str
    consensus_rating: str | None = None
    price_target: float | None = None
    current_price: float | None = None
    upside_pct: float | None = None
    num_analysts: int | None = None


@dataclass
class HistoricalPatterns:
    score: float
    pattern_desc: str
    beats_last_4q: int | None = None
    avg_reaction_pct: float | None = None


@dataclass
class MarketContext:
    vix_level: float
    vix_status: str  # "calm", "elevated", "fear"
    spy_trend_10d: float
    qqq_trend_10d: float
    market_regime: str  # "bull", "bear", "choppy"
    score: float
    explanation: str


@dataclass
class SectorComparison:
    sector_name: str
    industry_name: str
    stock_return_1m: float
    sector_return_1m: float
    relative_strength: float
    sector_trend: str  # "strong uptrend", "downtrend", etc.
    score: float
    explanation: str


@dataclass
class EarningsTiming:
    days_until_earnings: int | None
    days_since_earnings: int | None
    next_earnings_date: str | None
    last_earnings_date: str | None
    timing_flag: str  # "pre_earnings", "post_earnings", "safe"
    price_change_5d: float | None
    confidence_adjustment: float
    caveats: list[str]


@dataclass
class MomentumAnalysis:
    rsi_14d: float | None
    rsi_status: str  # "overbought", "oversold", "neutral"
    price_vs_52w_low: float | None
    price_vs_52w_high: float | None
    near_52w_high: bool
    near_52w_low: bool
    volume_ratio: float | None
    relative_strength_vs_sector: float | None
    score: float
    explanation: str


@dataclass
class SentimentAnalysis:
    score: float  # Overall -1.0 to 1.0
    explanation: str  # Human-readable summary

    # Sub-indicator scores
    fear_greed_score: float | None = None
    short_interest_score: float | None = None
    vix_structure_score: float | None = None
    insider_activity_score: float | None = None
    put_call_score: float | None = None

    # Raw data
    fear_greed_value: int | None = None  # 0-100
    fear_greed_status: str | None = None  # "Extreme Fear", etc.
    short_interest_pct: float | None = None
    days_to_cover: float | None = None
    vix_structure: str | None = None  # "contango", "backwardation", "flat"
    vix_slope: float | None = None
    insider_net_shares: int | None = None
    insider_net_value: float | None = None  # Millions USD
    put_call_ratio: float | None = None
    put_volume: int | None = None
    call_volume: int | None = None

    # Metadata
    indicators_available: int = 0
    data_freshness_warnings: list[str] | None = None


@dataclass
class Signal:
    ticker: str
    company_name: str
    recommendation: Literal["BUY", "HOLD", "SELL"]
    confidence: float
    final_score: float
    supporting_points: list[str]
    caveats: list[str]
    timestamp: str
    components: dict


def fetch_stock_data(ticker: str, verbose: bool = False) -> StockData | None:
    """Fetch stock data from Yahoo Finance with retry logic."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            if verbose:
                print(f"Fetching data for {ticker}... (attempt {attempt + 1}/{max_retries})", file=sys.stderr)

            stock = yf.Ticker(ticker)
            info = stock.info

            # Validate ticker
            if not info or "regularMarketPrice" not in info:
                return None

            # Fetch earnings history
            try:
                earnings_history = stock.earnings_dates
            except Exception:
                earnings_history = None

            # Fetch analyst info
            try:
                analyst_info = {
                    "recommendations": stock.recommendations,
                    "analyst_price_targets": stock.analyst_price_targets,
                }
            except Exception:
                analyst_info = None

            # Fetch price history (1 year for historical patterns)
            try:
                price_history = stock.history(period="1y")
            except Exception:
                price_history = None

            return StockData(
                ticker=ticker,
                info=info,
                earnings_history=earnings_history,
                analyst_info=analyst_info,
                price_history=price_history,
            )

        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                if verbose:
                    print(f"Error fetching {ticker}: {e}. Retrying in {wait_time}s...", file=sys.stderr)
                time.sleep(wait_time)
            else:
                if verbose:
                    print(f"Failed to fetch {ticker} after {max_retries} attempts", file=sys.stderr)
                return None

    return None


def analyze_earnings_surprise(data: StockData) -> EarningsSurprise | None:
    """Analyze earnings surprise from most recent quarter."""
    if data.earnings_history is None or data.earnings_history.empty:
        return None

    try:
        # Get most recent earnings with actual data
        recent = data.earnings_history.sort_index(ascending=False).head(10)

        for idx, row in recent.iterrows():
            if pd.notna(row.get("Reported EPS")) and pd.notna(row.get("EPS Estimate")):
                actual = float(row["Reported EPS"])
                expected = float(row["EPS Estimate"])

                if expected == 0:
                    continue

                surprise_pct = ((actual - expected) / abs(expected)) * 100

                # Score based on surprise percentage
                if surprise_pct > 10:
                    score = 1.0
                elif surprise_pct > 5:
                    score = 0.7
                elif surprise_pct > 0:
                    score = 0.3
                elif surprise_pct > -5:
                    score = -0.3
                elif surprise_pct > -10:
                    score = -0.7
                else:
                    score = -1.0

                explanation = f"{'Beat' if surprise_pct > 0 else 'Missed'} by {abs(surprise_pct):.1f}%"

                return EarningsSurprise(
                    score=score,
                    explanation=explanation,
                    actual_eps=actual,
                    expected_eps=expected,
                    surprise_pct=surprise_pct,
                )

        return None

    except Exception:
        return None


def analyze_fundamentals(data: StockData) -> Fundamentals | None:
    """Analyze fundamental metrics."""
    info = data.info
    scores = []
    metrics = {}
    explanations = []

    try:
        # P/E Ratio (lower is better, but consider growth)
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        if pe_ratio and pe_ratio > 0:
            metrics["pe_ratio"] = round(pe_ratio, 2)
            if pe_ratio < 15:
                scores.append(0.5)
                explanations.append(f"Attractive P/E: {pe_ratio:.1f}x")
            elif pe_ratio > 30:
                scores.append(-0.3)
                explanations.append(f"Elevated P/E: {pe_ratio:.1f}x")
            else:
                scores.append(0.1)

        # Operating Margin
        op_margin = info.get("operatingMargins")
        if op_margin:
            metrics["operating_margin"] = round(op_margin, 3)
            if op_margin > 0.15:
                scores.append(0.5)
                explanations.append(f"Strong margin: {op_margin*100:.1f}%")
            elif op_margin < 0.05:
                scores.append(-0.5)
                explanations.append(f"Weak margin: {op_margin*100:.1f}%")

        # Revenue Growth
        rev_growth = info.get("revenueGrowth")
        if rev_growth:
            metrics["revenue_growth_yoy"] = round(rev_growth, 3)
            if rev_growth > 0.20:
                scores.append(0.5)
                explanations.append(f"Strong growth: {rev_growth*100:.1f}% YoY")
            elif rev_growth < 0.05:
                scores.append(-0.3)
                explanations.append(f"Slow growth: {rev_growth*100:.1f}% YoY")
            else:
                scores.append(0.2)

        # Debt to Equity
        debt_equity = info.get("debtToEquity")
        if debt_equity is not None:
            metrics["debt_to_equity"] = round(debt_equity / 100, 2)
            if debt_equity < 50:
                scores.append(0.3)
            elif debt_equity > 200:
                scores.append(-0.5)
                explanations.append(f"High debt: D/E {debt_equity/100:.1f}x")

        if not scores:
            return None

        # Average and normalize
        avg_score = sum(scores) / len(scores)
        normalized_score = max(-1.0, min(1.0, avg_score))

        explanation = "; ".join(explanations) if explanations else "Mixed fundamentals"

        return Fundamentals(
            score=normalized_score,
            key_metrics=metrics,
            explanation=explanation,
        )

    except Exception:
        return None


def analyze_analyst_sentiment(data: StockData) -> AnalystSentiment | None:
    """Analyze analyst sentiment and price targets."""
    info = data.info

    try:
        # Get current price
        current_price = info.get("regularMarketPrice") or info.get("currentPrice")
        if not current_price:
            return None

        # Get target price
        target_price = info.get("targetMeanPrice")

        # Get number of analysts
        num_analysts = info.get("numberOfAnalystOpinions")

        # Get recommendation
        recommendation = info.get("recommendationKey")

        if not target_price or not recommendation:
            return AnalystSentiment(
                score=None,
                summary="No analyst coverage available",
            )

        # Calculate upside
        upside_pct = ((target_price - current_price) / current_price) * 100

        # Score based on recommendation and upside
        rec_scores = {
            "strong_buy": 1.0,
            "buy": 0.7,
            "hold": 0.0,
            "sell": -0.7,
            "strong_sell": -1.0,
        }

        base_score = rec_scores.get(recommendation, 0.0)

        # Adjust based on upside
        if upside_pct > 20:
            score = min(1.0, base_score + 0.3)
        elif upside_pct > 10:
            score = min(1.0, base_score + 0.15)
        elif upside_pct < -10:
            score = max(-1.0, base_score - 0.3)
        else:
            score = base_score

        # Format recommendation
        rec_display = recommendation.replace("_", " ").title()

        summary = f"{rec_display} with {abs(upside_pct):.1f}% {'upside' if upside_pct > 0 else 'downside'}"
        if num_analysts:
            summary += f" ({num_analysts} analysts)"

        return AnalystSentiment(
            score=score,
            summary=summary,
            consensus_rating=rec_display,
            price_target=target_price,
            current_price=current_price,
            upside_pct=upside_pct,
            num_analysts=num_analysts,
        )

    except Exception:
        return AnalystSentiment(
            score=None,
            summary="Error analyzing analyst sentiment",
        )


def analyze_historical_patterns(data: StockData) -> HistoricalPatterns | None:
    """Analyze historical earnings patterns."""
    if data.earnings_history is None or data.price_history is None:
        return None

    if data.earnings_history.empty or data.price_history.empty:
        return None

    try:
        # Get last 4 quarters earnings dates
        earnings_dates = data.earnings_history.sort_index(ascending=False).head(4)

        beats = 0
        reactions = []

        for earnings_date, row in earnings_dates.iterrows():
            if pd.notna(row.get("Reported EPS")) and pd.notna(row.get("EPS Estimate")):
                actual = float(row["Reported EPS"])
                expected = float(row["EPS Estimate"])

                if actual > expected:
                    beats += 1

                # Try to get price reaction (day of earnings)
                try:
                    earnings_day = pd.Timestamp(earnings_date).date()

                    # Find closest trading day
                    price_data = data.price_history[data.price_history.index.date == earnings_day]

                    if not price_data.empty:
                        day_change = ((price_data["Close"].iloc[0] - price_data["Open"].iloc[0]) / price_data["Open"].iloc[0]) * 100
                        reactions.append(day_change)
                except Exception:
                    continue

        total_quarters = len(earnings_dates)
        if total_quarters == 0:
            return None

        # Score based on beat rate
        beat_rate = beats / total_quarters

        if beat_rate == 1.0:
            score = 0.8
        elif beat_rate >= 0.75:
            score = 0.5
        elif beat_rate >= 0.5:
            score = 0.0
        elif beat_rate >= 0.25:
            score = -0.5
        else:
            score = -0.8

        # Pattern description
        pattern_desc = f"{beats}/{total_quarters} quarters beat expectations"

        if reactions:
            avg_reaction = sum(reactions) / len(reactions)
            pattern_desc += f", avg reaction {avg_reaction:+.1f}%"
        else:
            avg_reaction = None

        return HistoricalPatterns(
            score=score,
            pattern_desc=pattern_desc,
            beats_last_4q=beats,
            avg_reaction_pct=avg_reaction,
        )

    except Exception:
        return None


def analyze_market_context(verbose: bool = False) -> MarketContext | None:
    """Analyze overall market conditions using VIX, SPY, and QQQ."""
    try:
        if verbose:
            print("Fetching market indicators (VIX, SPY, QQQ)...", file=sys.stderr)

        # Fetch market indicators
        vix = yf.Ticker("^VIX")
        spy = yf.Ticker("SPY")
        qqq = yf.Ticker("QQQ")

        # Get current VIX level
        vix_info = vix.info
        vix_level = vix_info.get("regularMarketPrice") or vix_info.get("currentPrice")

        if not vix_level:
            return None

        # Determine VIX status
        if vix_level < 20:
            vix_status = "calm"
            vix_score = 0.2
        elif vix_level < 30:
            vix_status = "elevated"
            vix_score = 0.0
        else:
            vix_status = "fear"
            vix_score = -0.5

        # Get SPY and QQQ 10-day trends
        spy_hist = spy.history(period="1mo")
        qqq_hist = qqq.history(period="1mo")

        if spy_hist.empty or qqq_hist.empty:
            return None

        # Calculate 10-day price changes
        spy_10d_ago = spy_hist["Close"].iloc[-min(10, len(spy_hist))]
        spy_current = spy_hist["Close"].iloc[-1]
        spy_trend_10d = ((spy_current - spy_10d_ago) / spy_10d_ago) * 100

        qqq_10d_ago = qqq_hist["Close"].iloc[-min(10, len(qqq_hist))]
        qqq_current = qqq_hist["Close"].iloc[-1]
        qqq_trend_10d = ((qqq_current - qqq_10d_ago) / qqq_10d_ago) * 100

        # Determine market regime
        avg_trend = (spy_trend_10d + qqq_trend_10d) / 2

        if avg_trend > 3:
            market_regime = "bull"
            regime_score = 0.3
        elif avg_trend < -3:
            market_regime = "bear"
            regime_score = -0.4
        else:
            market_regime = "choppy"
            regime_score = -0.1

        # Calculate overall score
        overall_score = (vix_score + regime_score) / 2

        # Build explanation
        explanation = f"VIX {vix_level:.1f} ({vix_status}), Market {market_regime} (SPY {spy_trend_10d:+.1f}%, QQQ {qqq_trend_10d:+.1f}% 10d)"

        return MarketContext(
            vix_level=vix_level,
            vix_status=vix_status,
            spy_trend_10d=spy_trend_10d,
            qqq_trend_10d=qqq_trend_10d,
            market_regime=market_regime,
            score=overall_score,
            explanation=explanation,
        )

    except Exception as e:
        if verbose:
            print(f"Error analyzing market context: {e}", file=sys.stderr)
        return None


def get_sector_etf_ticker(sector: str) -> str | None:
    """Map sector name to corresponding sector ETF ticker."""
    sector_map = {
        "Financial Services": "XLF",
        "Financials": "XLF",
        "Technology": "XLK",
        "Healthcare": "XLV",
        "Consumer Cyclical": "XLY",
        "Consumer Defensive": "XLP",
        "Utilities": "XLU",
        "Basic Materials": "XLB",
        "Real Estate": "XLRE",
        "Communication Services": "XLC",
        "Industrials": "XLI",
        "Energy": "XLE",
    }

    return sector_map.get(sector)


def analyze_sector_performance(data: StockData, verbose: bool = False) -> SectorComparison | None:
    """Compare stock performance to its sector."""
    try:
        sector = data.info.get("sector")
        industry = data.info.get("industry")

        if not sector:
            return None

        sector_etf_ticker = get_sector_etf_ticker(sector)

        if not sector_etf_ticker:
            if verbose:
                print(f"No sector ETF mapping for {sector}", file=sys.stderr)
            return None

        if verbose:
            print(f"Comparing to sector ETF: {sector_etf_ticker}", file=sys.stderr)

        # Fetch sector ETF data
        sector_etf = yf.Ticker(sector_etf_ticker)
        sector_hist = sector_etf.history(period="3mo")

        if sector_hist.empty or data.price_history is None or data.price_history.empty:
            return None

        # Calculate 1-month returns
        stock_1m_ago = data.price_history["Close"].iloc[-min(22, len(data.price_history))]
        stock_current = data.price_history["Close"].iloc[-1]
        stock_return_1m = ((stock_current - stock_1m_ago) / stock_1m_ago) * 100

        sector_1m_ago = sector_hist["Close"].iloc[-min(22, len(sector_hist))]
        sector_current = sector_hist["Close"].iloc[-1]
        sector_return_1m = ((sector_current - sector_1m_ago) / sector_1m_ago) * 100

        # Calculate relative strength
        relative_strength = stock_return_1m / sector_return_1m if sector_return_1m != 0 else 1.0

        # Sector 10-day trend
        sector_10d_ago = sector_hist["Close"].iloc[-min(10, len(sector_hist))]
        sector_trend_10d = ((sector_current - sector_10d_ago) / sector_10d_ago) * 100

        if sector_trend_10d > 5:
            sector_trend = "strong uptrend"
        elif sector_trend_10d > 2:
            sector_trend = "uptrend"
        elif sector_trend_10d < -5:
            sector_trend = "downtrend"
        elif sector_trend_10d < -2:
            sector_trend = "weak"
        else:
            sector_trend = "neutral"

        # Calculate score
        score = 0.0

        # Relative performance score
        if relative_strength > 1.05:  # Outperforming by >5%
            score += 0.3
        elif relative_strength < 0.95:  # Underperforming by >5%
            score -= 0.3

        # Sector trend score
        if sector_trend_10d > 5:
            score += 0.2
        elif sector_trend_10d < -5:
            score -= 0.2

        explanation = f"{sector} sector {sector_trend} ({sector_return_1m:+.1f}% 1m), stock {stock_return_1m:+.1f}% vs sector"

        return SectorComparison(
            sector_name=sector,
            industry_name=industry or "Unknown",
            stock_return_1m=stock_return_1m,
            sector_return_1m=sector_return_1m,
            relative_strength=relative_strength,
            sector_trend=sector_trend,
            score=score,
            explanation=explanation,
        )

    except Exception as e:
        if verbose:
            print(f"Error analyzing sector performance: {e}", file=sys.stderr)
        return None


def analyze_earnings_timing(data: StockData) -> EarningsTiming | None:
    """Check earnings timing and flag pre/post-earnings periods."""
    try:
        from datetime import datetime, timedelta

        if data.earnings_history is None or data.earnings_history.empty:
            return None

        current_date = datetime.now()
        earnings_dates = data.earnings_history.sort_index(ascending=False)

        # Find next and last earnings dates
        next_earnings_date = None
        last_earnings_date = None

        for earnings_date in earnings_dates.index:
            earnings_dt = pd.Timestamp(earnings_date).to_pydatetime()

            if earnings_dt > current_date and next_earnings_date is None:
                next_earnings_date = earnings_dt
            elif earnings_dt <= current_date and last_earnings_date is None:
                last_earnings_date = earnings_dt
                break

        # Calculate days until/since earnings
        days_until_earnings = None
        days_since_earnings = None

        if next_earnings_date:
            days_until_earnings = (next_earnings_date - current_date).days

        if last_earnings_date:
            days_since_earnings = (current_date - last_earnings_date).days

        # Determine timing flag
        timing_flag = "safe"
        confidence_adjustment = 0.0
        caveats = []

        # Pre-earnings check (< 14 days)
        if days_until_earnings is not None and days_until_earnings <= 14:
            timing_flag = "pre_earnings"
            confidence_adjustment = -0.3
            caveats.append(f"Earnings in {days_until_earnings} days - high volatility expected")

        # Post-earnings check (< 5 days)
        price_change_5d = None
        if days_since_earnings is not None and days_since_earnings <= 5:
            # Calculate 5-day price change
            if data.price_history is not None and len(data.price_history) >= 5:
                price_5d_ago = data.price_history["Close"].iloc[-5]
                price_current = data.price_history["Close"].iloc[-1]
                price_change_5d = ((price_current - price_5d_ago) / price_5d_ago) * 100

                if price_change_5d > 15:
                    timing_flag = "post_earnings"
                    confidence_adjustment = -0.2
                    caveats.append(f"Up {price_change_5d:.1f}% in 5 days - gains may be priced in")

        return EarningsTiming(
            days_until_earnings=days_until_earnings,
            days_since_earnings=days_since_earnings,
            next_earnings_date=next_earnings_date.strftime("%Y-%m-%d") if next_earnings_date else None,
            last_earnings_date=last_earnings_date.strftime("%Y-%m-%d") if last_earnings_date else None,
            timing_flag=timing_flag,
            price_change_5d=price_change_5d,
            confidence_adjustment=confidence_adjustment,
            caveats=caveats,
        )

    except Exception:
        return None


def calculate_rsi(prices: pd.Series, period: int = 14) -> float | None:
    """Calculate RSI (Relative Strength Index)."""
    try:
        if len(prices) < period + 1:
            return None

        # Calculate price changes
        delta = prices.diff()

        # Separate gains and losses
        gains = delta.where(delta > 0, 0)
        losses = -delta.where(delta < 0, 0)

        # Calculate average gains and losses
        avg_gain = gains.rolling(window=period).mean()
        avg_loss = losses.rolling(window=period).mean()

        # Calculate RS
        rs = avg_gain / avg_loss

        # Calculate RSI
        rsi = 100 - (100 / (1 + rs))

        return float(rsi.iloc[-1])

    except Exception:
        return None


def analyze_momentum(data: StockData) -> MomentumAnalysis | None:
    """Analyze momentum indicators (RSI, 52w range, volume, relative strength)."""
    try:
        if data.price_history is None or data.price_history.empty:
            return None

        # Calculate RSI
        rsi_14d = calculate_rsi(data.price_history["Close"], period=14)

        if rsi_14d:
            if rsi_14d > 70:
                rsi_status = "overbought"
            elif rsi_14d < 30:
                rsi_status = "oversold"
            else:
                rsi_status = "neutral"
        else:
            rsi_status = "unknown"

        # Get 52-week high/low
        high_52w = data.info.get("fiftyTwoWeekHigh")
        low_52w = data.info.get("fiftyTwoWeekLow")
        current_price = data.info.get("regularMarketPrice") or data.info.get("currentPrice")

        price_vs_52w_low = None
        price_vs_52w_high = None
        near_52w_high = False
        near_52w_low = False

        if high_52w and low_52w and current_price:
            price_range = high_52w - low_52w
            if price_range > 0:
                price_vs_52w_low = ((current_price - low_52w) / price_range) * 100
                price_vs_52w_high = ((high_52w - current_price) / price_range) * 100

                near_52w_high = price_vs_52w_low > 90
                near_52w_low = price_vs_52w_low < 10

        # Volume analysis
        volume_ratio = None
        if "Volume" in data.price_history.columns and len(data.price_history) >= 60:
            recent_vol = data.price_history["Volume"].iloc[-5:].mean()
            avg_vol = data.price_history["Volume"].iloc[-60:].mean()
            volume_ratio = recent_vol / avg_vol if avg_vol > 0 else None

        # Calculate score
        score = 0.0
        explanations = []

        if rsi_14d:
            if rsi_14d > 70:
                score -= 0.5
                explanations.append(f"RSI {rsi_14d:.0f} (overbought)")
            elif rsi_14d < 30:
                score += 0.5
                explanations.append(f"RSI {rsi_14d:.0f} (oversold)")

        if near_52w_high:
            score -= 0.3
            explanations.append("Near 52w high")
        elif near_52w_low:
            score += 0.3
            explanations.append("Near 52w low")

        if volume_ratio and volume_ratio > 1.5:
            explanations.append(f"Volume {volume_ratio:.1f}x average")

        explanation = "; ".join(explanations) if explanations else "Momentum indicators neutral"

        return MomentumAnalysis(
            rsi_14d=rsi_14d,
            rsi_status=rsi_status,
            price_vs_52w_low=price_vs_52w_low,
            price_vs_52w_high=price_vs_52w_high,
            near_52w_high=near_52w_high,
            near_52w_low=near_52w_low,
            volume_ratio=volume_ratio,
            relative_strength_vs_sector=None,  # Could be enhanced with sector comparison
            score=score,
            explanation=explanation,
        )

    except Exception:
        return None


# ============================================================================
# Sentiment Analysis Helper Functions
# ============================================================================


def get_fear_greed_index() -> tuple[float, int | None, str | None] | None:
    """
    Fetch CNN Fear & Greed Index (contrarian indicator).
    Returns: (score, value, status) or None on failure.
    """
    try:
        from fear_and_greed import get as get_fear_greed

        result = get_fear_greed()
        value = result.value  # 0-100
        status = result.description  # "Extreme Fear", "Fear", etc.

        # Contrarian scoring
        if value <= 25:
            score = 0.5  # Extreme fear = buy opportunity
        elif value <= 45:
            score = 0.2  # Fear = mild buy signal
        elif value <= 55:
            score = 0.0  # Neutral
        elif value <= 75:
            score = -0.2  # Greed = caution
        else:
            score = -0.5  # Extreme greed = warning

        return (score, value, status)
    except Exception:
        return None


def get_short_interest(data: StockData) -> tuple[float, float | None, float | None] | None:
    """
    Analyze short interest (from yfinance).
    Returns: (score, short_interest_pct, days_to_cover) or None.
    """
    try:
        short_pct = data.info.get("shortPercentOfFloat")
        if short_pct is None:
            return None

        short_pct_float = float(short_pct) * 100  # Convert to percentage

        # Estimate days to cover (simplified - actual calculation needs volume data)
        short_ratio = data.info.get("shortRatio")  # Days to cover
        days_to_cover = float(short_ratio) if short_ratio else None

        # Scoring logic
        if short_pct_float > 20:
            if days_to_cover and days_to_cover > 10:
                score = 0.4  # High short interest + high days to cover = squeeze potential
            else:
                score = -0.3  # High short interest but justified
        elif short_pct_float < 5:
            score = 0.2  # Low short interest = bullish sentiment
        else:
            score = 0.0  # Normal range

        return (score, short_pct_float, days_to_cover)
    except Exception:
        return None


def get_vix_term_structure() -> tuple[float, str | None, float | None] | None:
    """
    Analyze VIX futures term structure (contango vs backwardation).
    Returns: (score, structure, slope) or None.
    """
    try:
        import yfinance as yf

        # Fetch VIX spot and 3-month VIX future (simplified approach)
        vix = yf.Ticker("^VIX")
        vix_data = vix.history(period="5d")

        if vix_data.empty:
            return None

        vix_spot = vix_data["Close"].iloc[-1]

        # Try to fetch VIX futures (VX) - simplified approach
        # Note: This is approximate - ideally use vix-utils or CBOE data
        # For now, use a simplified heuristic based on VIX level

        # Simplified: assume normal contango when VIX < 20, backwardation when VIX > 30
        if vix_spot < 15:
            structure = "contango"
            slope = 10.0  # Steep contango
            score = 0.3  # Complacency/bullish
        elif vix_spot < 20:
            structure = "contango"
            slope = 5.0
            score = 0.1
        elif vix_spot > 30:
            structure = "backwardation"
            slope = -5.0
            score = -0.3  # Stress/bearish
        else:
            structure = "flat"
            slope = 0.0
            score = 0.0

        return (score, structure, slope)
    except Exception:
        return None


def get_insider_activity(ticker: str, period_days: int = 90) -> tuple[float, int | None, float | None] | None:
    """
    Analyze insider trading from SEC Form 4 filings.
    Returns: (score, net_shares, net_value_millions) or None.

    Note: SEC EDGAR API requires User-Agent with email.
    """
    try:
        from edgar import Company, set_identity

        # Required by SEC EDGAR API terms
        set_identity("stock-analysis@clawd.bot")

        company = Company(ticker)

        # Get insider transactions (simplified - would need full Form 4 parsing)
        # For now, return None as edgartools API may vary
        # This is a placeholder - full implementation would parse transactions

        return None  # Temporarily disabled - needs proper edgartools integration

    except Exception:
        return None


def get_put_call_ratio(data: StockData) -> tuple[float, float | None, int | None, int | None] | None:
    """
    Calculate put/call ratio from options chain (contrarian indicator).
    Returns: (score, ratio, put_volume, call_volume) or None.
    """
    try:
        if data.ticker_obj is None:
            return None

        # Get options chain for nearest expiration
        expirations = data.ticker_obj.options
        if not expirations or len(expirations) == 0:
            return None

        nearest_exp = expirations[0]
        opt_chain = data.ticker_obj.option_chain(nearest_exp)

        # Calculate total put and call volume
        put_volume = opt_chain.puts["volume"].sum() if "volume" in opt_chain.puts.columns else 0
        call_volume = opt_chain.calls["volume"].sum() if "volume" in opt_chain.calls.columns else 0

        if call_volume == 0 or put_volume == 0:
            return None

        ratio = put_volume / call_volume

        # Contrarian scoring
        if ratio > 1.5:
            score = 0.3  # Excessive fear = bullish
        elif ratio > 1.0:
            score = 0.1  # Mild fear
        elif ratio > 0.7:
            score = -0.1  # Normal
        else:
            score = -0.3  # Complacency = bearish

        return (score, ratio, int(put_volume), int(call_volume))
    except Exception:
        return None


def analyze_sentiment(data: StockData, verbose: bool = False) -> SentimentAnalysis | None:
    """
    Analyze market sentiment using 5 sub-indicators.
    Requires at least 2 of 5 indicators for valid sentiment.
    Returns overall sentiment score (-1.0 to +1.0) with sub-metrics.
    """
    scores = []
    explanations = []
    warnings = []

    # Initialize all raw data fields
    fear_greed_score = None
    fear_greed_value = None
    fear_greed_status = None

    short_interest_score = None
    short_interest_pct = None
    days_to_cover = None

    vix_structure_score = None
    vix_structure = None
    vix_slope = None

    insider_activity_score = None
    insider_net_shares = None
    insider_net_value = None

    put_call_score = None
    put_call_ratio = None
    put_volume = None
    call_volume = None

    # 1. Fear & Greed Index
    try:
        result = get_fear_greed_index()
        if result:
            fear_greed_score, fear_greed_value, fear_greed_status = result
            scores.append(fear_greed_score)
            explanations.append(f"{fear_greed_status} ({fear_greed_value})")
            if verbose:
                print(f"    Fear & Greed: {fear_greed_status} ({fear_greed_value}) → score {fear_greed_score:+.2f}", file=sys.stderr)
    except Exception as e:
        if verbose:
            print(f"    Fear & Greed: Failed ({e})", file=sys.stderr)

    # 2. Short Interest
    try:
        result = get_short_interest(data)
        if result:
            short_interest_score, short_interest_pct, days_to_cover = result
            scores.append(short_interest_score)
            if days_to_cover:
                explanations.append(f"Short interest {short_interest_pct:.1f}% (days to cover: {days_to_cover:.1f})")
            else:
                explanations.append(f"Short interest {short_interest_pct:.1f}%")
            warnings.append("Short interest data typically ~2 weeks old (FINRA lag)")
            if verbose:
                print(f"    Short Interest: {short_interest_pct:.1f}% → score {short_interest_score:+.2f}", file=sys.stderr)
    except Exception as e:
        if verbose:
            print(f"    Short Interest: Failed ({e})", file=sys.stderr)

    # 3. VIX Term Structure
    try:
        result = get_vix_term_structure()
        if result:
            vix_structure_score, vix_structure, vix_slope = result
            scores.append(vix_structure_score)
            explanations.append(f"VIX {vix_structure}")
            if verbose:
                print(f"    VIX Structure: {vix_structure} (slope {vix_slope:.1f}%) → score {vix_structure_score:+.2f}", file=sys.stderr)
    except Exception as e:
        if verbose:
            print(f"    VIX Structure: Failed ({e})", file=sys.stderr)

    # 4. Insider Activity
    try:
        result = get_insider_activity(data.ticker, period_days=90)
        if result:
            insider_activity_score, insider_net_shares, insider_net_value = result
            scores.append(insider_activity_score)
            if insider_net_value:
                explanations.append(f"Insider net: ${insider_net_value:.1f}M")
            warnings.append("Insider trades may lag filing by 2-3 days")
            if verbose:
                print(f"    Insider Activity: Net ${insider_net_value:.1f}M → score {insider_activity_score:+.2f}", file=sys.stderr)
    except Exception as e:
        if verbose:
            print(f"    Insider Activity: Failed ({e})", file=sys.stderr)

    # 5. Put/Call Ratio
    try:
        result = get_put_call_ratio(data)
        if result:
            put_call_score, put_call_ratio, put_volume, call_volume = result
            scores.append(put_call_score)
            explanations.append(f"Put/call ratio {put_call_ratio:.2f}")
            if verbose:
                print(f"    Put/Call Ratio: {put_call_ratio:.2f} → score {put_call_score:+.2f}", file=sys.stderr)
    except Exception as e:
        if verbose:
            print(f"    Put/Call Ratio: Failed ({e})", file=sys.stderr)

    # Require at least 2 of 5 indicators for valid sentiment
    indicators_available = len(scores)
    if indicators_available < 2:
        if verbose:
            print(f"    Sentiment: Insufficient data ({indicators_available}/5 indicators)", file=sys.stderr)
        return None

    # Calculate overall score as simple average
    overall_score = sum(scores) / len(scores)
    explanation = "; ".join(explanations)

    return SentimentAnalysis(
        score=overall_score,
        explanation=explanation,
        fear_greed_score=fear_greed_score,
        short_interest_score=short_interest_score,
        vix_structure_score=vix_structure_score,
        insider_activity_score=insider_activity_score,
        put_call_score=put_call_score,
        fear_greed_value=fear_greed_value,
        fear_greed_status=fear_greed_status,
        short_interest_pct=short_interest_pct,
        days_to_cover=days_to_cover,
        vix_structure=vix_structure,
        vix_slope=vix_slope,
        insider_net_shares=insider_net_shares,
        insider_net_value=insider_net_value,
        put_call_ratio=put_call_ratio,
        put_volume=put_volume,
        call_volume=call_volume,
        indicators_available=indicators_available,
        data_freshness_warnings=warnings if warnings else None,
    )


def synthesize_signal(
    ticker: str,
    company_name: str,
    earnings: EarningsSurprise | None,
    fundamentals: Fundamentals | None,
    analysts: AnalystSentiment | None,
    historical: HistoricalPatterns | None,
    market_context: MarketContext | None,
    sector: SectorComparison | None,
    earnings_timing: EarningsTiming | None,
    momentum: MomentumAnalysis | None,
    sentiment: SentimentAnalysis | None,
) -> Signal:
    """Synthesize all components into a final signal."""

    # Collect available components with weights
    components = []
    weights = []

    if earnings:
        components.append(("earnings", earnings.score))
        weights.append(0.30)  # reduced from 0.35

    if fundamentals:
        components.append(("fundamentals", fundamentals.score))
        weights.append(0.20)  # reduced from 0.25

    if analysts and analysts.score is not None:
        components.append(("analysts", analysts.score))
        weights.append(0.20)  # reduced from 0.25

    if historical:
        components.append(("historical", historical.score))
        weights.append(0.10)  # reduced from 0.15

    # NEW COMPONENTS
    if market_context:
        components.append(("market", market_context.score))
        weights.append(0.10)

    if sector:
        components.append(("sector", sector.score))
        weights.append(0.15)

    if momentum:
        components.append(("momentum", momentum.score))
        weights.append(0.15)

    if sentiment:
        components.append(("sentiment", sentiment.score))
        weights.append(0.10)

    # Require at least 2 components
    if len(components) < 2:
        return Signal(
            ticker=ticker,
            company_name=company_name,
            recommendation="HOLD",
            confidence=0.0,
            final_score=0.0,
            supporting_points=["Insufficient data for analysis"],
            caveats=["Limited data available"],
            timestamp=datetime.now().isoformat(),
            components={},
        )

    # Normalize weights
    total_weight = sum(weights)
    normalized_weights = [w / total_weight for w in weights]

    # Calculate weighted score
    final_score = sum(score * weight for (_, score), weight in zip(components, normalized_weights))

    # Determine recommendation
    if final_score > 0.33:
        recommendation = "BUY"
    elif final_score < -0.33:
        recommendation = "SELL"
    else:
        recommendation = "HOLD"

    confidence = abs(final_score)

    # Apply earnings timing adjustments and overrides
    if earnings_timing:
        confidence *= (1.0 + earnings_timing.confidence_adjustment)

        # Override recommendation if needed
        if earnings_timing.timing_flag == "pre_earnings":
            if recommendation == "BUY":
                recommendation = "HOLD"

        elif earnings_timing.timing_flag == "post_earnings":
            if earnings_timing.price_change_5d and earnings_timing.price_change_5d > 15:
                if recommendation == "BUY":
                    recommendation = "HOLD"

    # Check overbought + near 52w high
    if momentum and momentum.rsi_14d and momentum.rsi_14d > 70 and momentum.near_52w_high:
        if recommendation == "BUY":
            recommendation = "HOLD"
            confidence *= 0.7

    # Generate supporting points
    supporting_points = []

    if earnings and earnings.actual_eps is not None:
        supporting_points.append(
            f"{earnings.explanation} - EPS ${earnings.actual_eps:.2f} vs ${earnings.expected_eps:.2f} expected"
        )

    if fundamentals and fundamentals.explanation:
        supporting_points.append(fundamentals.explanation)

    if analysts and analysts.summary:
        supporting_points.append(f"Analyst consensus: {analysts.summary}")

    if historical and historical.pattern_desc:
        supporting_points.append(f"Historical pattern: {historical.pattern_desc}")

    if market_context and market_context.explanation:
        supporting_points.append(f"Market: {market_context.explanation}")

    if sector and sector.explanation:
        supporting_points.append(f"Sector: {sector.explanation}")

    if momentum and momentum.explanation:
        supporting_points.append(f"Momentum: {momentum.explanation}")

    if sentiment and sentiment.explanation:
        supporting_points.append(f"Sentiment: {sentiment.explanation}")

    # Generate caveats
    caveats = []

    # Add earnings timing caveats first (most important)
    if earnings_timing and earnings_timing.caveats:
        caveats.extend(earnings_timing.caveats)

    # Add sentiment warnings
    if sentiment and sentiment.data_freshness_warnings:
        caveats.extend(sentiment.data_freshness_warnings)

    # Add momentum warnings
    if momentum and momentum.rsi_14d:
        if momentum.rsi_14d > 70 and momentum.near_52w_high:
            caveats.append("Overbought conditions - high risk entry")

    # Add sector warnings
    if sector and sector.score < -0.2:
        caveats.append(f"Sector {sector.sector_name} is weak despite stock fundamentals")

    # Add market warnings
    if market_context and market_context.vix_status == "fear":
        caveats.append(f"High market volatility (VIX {market_context.vix_level:.0f})")

    # Original caveats
    if not analysts or analysts.score is None:
        caveats.append("Limited or no analyst coverage")

    if not earnings:
        caveats.append("No recent earnings data available")

    if len(components) < 4:
        caveats.append("Analysis based on limited data components")

    if not caveats:
        caveats.append("Market conditions can change rapidly")

    # Limit to 5 caveats
    caveats = caveats[:5]

    # Build components dict for output
    components_dict = {}
    if earnings:
        components_dict["earnings_surprise"] = {
            "score": earnings.score,
            "actual_eps": earnings.actual_eps,
            "expected_eps": earnings.expected_eps,
            "surprise_pct": earnings.surprise_pct,
            "explanation": earnings.explanation,
        }

    if fundamentals:
        components_dict["fundamentals"] = {
            "score": fundamentals.score,
            **fundamentals.key_metrics,
        }

    if analysts:
        components_dict["analyst_sentiment"] = {
            "score": analysts.score,
            "consensus_rating": analysts.consensus_rating,
            "price_target": analysts.price_target,
            "current_price": analysts.current_price,
            "upside_pct": analysts.upside_pct,
            "num_analysts": analysts.num_analysts,
        }

    if historical:
        components_dict["historical_patterns"] = {
            "score": historical.score,
            "beats_last_4q": historical.beats_last_4q,
            "avg_reaction_pct": historical.avg_reaction_pct,
        }

    if market_context:
        components_dict["market_context"] = {
            "score": market_context.score,
            "vix_level": market_context.vix_level,
            "vix_status": market_context.vix_status,
            "spy_trend_10d": market_context.spy_trend_10d,
            "qqq_trend_10d": market_context.qqq_trend_10d,
            "market_regime": market_context.market_regime,
        }

    if sector:
        components_dict["sector_performance"] = {
            "score": sector.score,
            "sector_name": sector.sector_name,
            "stock_return_1m": sector.stock_return_1m,
            "sector_return_1m": sector.sector_return_1m,
            "relative_strength": sector.relative_strength,
            "sector_trend": sector.sector_trend,
        }

    if earnings_timing:
        components_dict["earnings_timing"] = {
            "days_until_earnings": earnings_timing.days_until_earnings,
            "days_since_earnings": earnings_timing.days_since_earnings,
            "timing_flag": earnings_timing.timing_flag,
            "price_change_5d": earnings_timing.price_change_5d,
            "confidence_adjustment": earnings_timing.confidence_adjustment,
        }

    if momentum:
        components_dict["momentum"] = {
            "score": momentum.score,
            "rsi_14d": momentum.rsi_14d,
            "rsi_status": momentum.rsi_status,
            "near_52w_high": momentum.near_52w_high,
            "near_52w_low": momentum.near_52w_low,
            "volume_ratio": momentum.volume_ratio,
        }

    if sentiment:
        components_dict["sentiment_analysis"] = {
            "score": sentiment.score,
            "indicators_available": sentiment.indicators_available,
            "fear_greed_value": sentiment.fear_greed_value,
            "fear_greed_status": sentiment.fear_greed_status,
            "short_interest_pct": sentiment.short_interest_pct,
            "days_to_cover": sentiment.days_to_cover,
            "vix_structure": sentiment.vix_structure,
            "vix_slope": sentiment.vix_slope,
            "insider_net_value": sentiment.insider_net_value,
            "put_call_ratio": sentiment.put_call_ratio,
            "data_freshness_warnings": sentiment.data_freshness_warnings,
        }

    return Signal(
        ticker=ticker,
        company_name=company_name,
        recommendation=recommendation,
        confidence=confidence,
        final_score=final_score,
        supporting_points=supporting_points[:5],  # Limit to 5
        caveats=caveats[:3],  # Limit to 3
        timestamp=datetime.now().isoformat(),
        components=components_dict,
    )


def format_output_text(signal: Signal) -> str:
    """Format signal as text output."""
    lines = [
        "=" * 77,
        f"STOCK ANALYSIS: {signal.ticker} ({signal.company_name})",
        f"Generated: {signal.timestamp}",
        "=" * 77,
        "",
        f"RECOMMENDATION: {signal.recommendation} (Confidence: {signal.confidence*100:.0f}%)",
        "",
        "SUPPORTING POINTS:",
    ]

    for point in signal.supporting_points:
        lines.append(f"• {point}")

    lines.extend([
        "",
        "CAVEATS:",
    ])

    for caveat in signal.caveats:
        lines.append(f"• {caveat}")

    lines.extend([
        "",
        "=" * 77,
        "DISCLAIMER: This analysis is for informational purposes only and does NOT",
        "constitute financial advice. Consult a licensed financial advisor before",
        "making investment decisions. Data provided by Yahoo Finance.",
        "=" * 77,
    ])

    return "\n".join(lines)


def format_output_json(signal: Signal) -> str:
    """Format signal as JSON output."""
    output = {
        **asdict(signal),
        "disclaimer": "NOT FINANCIAL ADVICE. For informational purposes only.",
    }
    return json.dumps(output, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="Analyze stocks using Yahoo Finance data"
    )
    parser.add_argument(
        "tickers",
        nargs="+",
        help="Stock ticker(s) to analyze"
    )
    parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Verbose output to stderr"
    )

    args = parser.parse_args()

    results = []

    for ticker in args.tickers:
        ticker = ticker.upper()

        if args.verbose:
            print(f"\n=== Analyzing {ticker} ===\n", file=sys.stderr)

        # Fetch data
        data = fetch_stock_data(ticker, verbose=args.verbose)

        if data is None:
            print(f"Error: Invalid ticker '{ticker}' or data unavailable", file=sys.stderr)
            sys.exit(2)

        # Get company name
        company_name = data.info.get("longName") or data.info.get("shortName") or ticker

        # Analyze all components
        earnings = analyze_earnings_surprise(data)
        fundamentals = analyze_fundamentals(data)
        analysts = analyze_analyst_sentiment(data)
        historical = analyze_historical_patterns(data)

        # NEW: Analyze market context (shared across all tickers if analyzing multiple)
        if args.verbose:
            print(f"Analyzing market context...", file=sys.stderr)
        market_context = analyze_market_context(verbose=args.verbose)

        # NEW: Analyze sector performance
        if args.verbose:
            print(f"Analyzing sector performance...", file=sys.stderr)
        sector = analyze_sector_performance(data, verbose=args.verbose)

        # NEW: Analyze earnings timing
        if args.verbose:
            print(f"Checking earnings timing...", file=sys.stderr)
        earnings_timing = analyze_earnings_timing(data)

        # NEW: Analyze momentum
        if args.verbose:
            print(f"Analyzing momentum...", file=sys.stderr)
        momentum = analyze_momentum(data)

        # NEW: Analyze sentiment
        if args.verbose:
            print(f"Analyzing market sentiment (5 indicators)...", file=sys.stderr)
        sentiment = analyze_sentiment(data, verbose=args.verbose)

        if args.verbose:
            print(f"Components analyzed:", file=sys.stderr)
            print(f"  Earnings: {'✓' if earnings else '✗'}", file=sys.stderr)
            print(f"  Fundamentals: {'✓' if fundamentals else '✗'}", file=sys.stderr)
            print(f"  Analysts: {'✓' if analysts and analysts.score else '✗'}", file=sys.stderr)
            print(f"  Historical: {'✓' if historical else '✗'}", file=sys.stderr)
            print(f"  Market Context: {'✓' if market_context else '✗'}", file=sys.stderr)
            print(f"  Sector: {'✓' if sector else '✗'}", file=sys.stderr)
            print(f"  Earnings Timing: {'✓' if earnings_timing else '✗'}", file=sys.stderr)
            print(f"  Momentum: {'✓' if momentum else '✗'}", file=sys.stderr)
            print(f"  Sentiment: {'✓' if sentiment else '✗'}\n", file=sys.stderr)

        # Synthesize signal
        signal = synthesize_signal(
            ticker=ticker,
            company_name=company_name,
            earnings=earnings,
            fundamentals=fundamentals,
            analysts=analysts,
            historical=historical,
            market_context=market_context,  # NEW
            sector=sector,  # NEW
            earnings_timing=earnings_timing,  # NEW
            momentum=momentum,  # NEW
            sentiment=sentiment,  # NEW
        )

        results.append(signal)

    # Output results
    if args.output == "json":
        if len(results) == 1:
            print(format_output_json(results[0]))
        else:
            print(json.dumps([asdict(r) for r in results], indent=2))
    else:
        for i, signal in enumerate(results):
            if i > 0:
                print("\n")
            print(format_output_text(signal))


if __name__ == "__main__":
    main()
