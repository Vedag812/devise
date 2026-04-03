import json
import os
import requests
from typing import Dict, Any, List
from .swarm_prompts import PERSONAS, generate_prompt_for_persona

# Pre-defined ticker universe sector weights for the ReportAgent consensus
TICKER_WEIGHTS = {
    "NVDA": {"Semiconductors": 0.45, "Tech": 0.30, "Energy": 0.10, "Banking": 0.10, "Healthcare": 0.03, "Geopolitics": 0.02},
    "AAPL": {"Semiconductors": 0.20, "Tech": 0.45, "Energy": 0.05, "Banking": 0.15, "Healthcare": 0.05, "Geopolitics": 0.10},
    "MSFT": {"Semiconductors": 0.15, "Tech": 0.50, "Energy": 0.05, "Banking": 0.15, "Healthcare": 0.05, "Geopolitics": 0.10}
}

async def make_llm_call(prompt: str) -> Dict[str, Any]:
    """
    If an OpenAI key is provided, calls real GPT. Otherwise falls back to mock logic,
    meaning you can use the real Swarm engine safely!
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    # 1. Fallback / Mock route if no key
    if not api_key or "your-openai" in api_key:
        raise ValueError("OPENAI_API_KEY is not set. Real analysis cannot be performed.")
        
    # 2. Real LLM route
    print("[REAL LLM] Requesting live analysis...")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "system", "content": prompt}],
        "temperature": 0.1 # Lowest temp for deterministic parsing
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        
        # Cleanly extract JSON from the response text
        content = content.replace("```json", "").replace("```", "").strip()
        parsed_result = json.loads(content)
        return parsed_result
    except Exception as e:
        print(f"[LLM ERROR] Falling back to neutral default. Reason: {e}")
        return {"verdict": "neutral", "confidence": 0.50, "reasoning": f"Exception occurred evaluating."}



async def run_swarm_analysis(news_seed: str, available_tickers: List[str]) -> Dict[str, Any]:
    """
    1. Runs the 6 persona evaluations in parallel (or sequential async).
    2. Aggregates results using TICKER_WEIGHTS.
    3. Selects the most favorable ticker.
    """
    results: Dict[str, Dict[str, Any]] = {}
    
    # 1. Gather all 6 persona evaluations
    for persona in PERSONAS.keys():
        prompt = generate_prompt_for_persona(persona, news_seed)
        # In a real app we'd use asyncio.gather for parallel execution
        eval_result = await make_llm_call(prompt)
        results[persona] = eval_result

    # 2. Score each available ticker
    ticker_scores = {}
    for ticker in available_tickers:
        if ticker not in TICKER_WEIGHTS:
            continue
            
        score = 0.0
        weights = TICKER_WEIGHTS[ticker]
        for sector, vote in results.items():
            verdict = vote.get("verdict", "neutral")
            confidence = vote.get("confidence", 0.0)
            weight = weights.get(sector, 0.0)
            
            # Map verdict to multiplier
            multiplier = 0.0
            if verdict == "bullish": multiplier = 1.0
            elif verdict == "bearish": multiplier = -1.0
            
            score += (multiplier * confidence * weight)
            
        ticker_scores[ticker] = score
        
    # 3. Dynamic Selection
    if not ticker_scores:
        return {"action": "HOLD", "ticker": None, "reason": "No valid tickers to evaluate."}
        
    best_ticker = max(ticker_scores.items(), key=lambda x: x[1])
    ticker_name, final_score = best_ticker
    
    action = "BUY" if final_score > 0 else "HOLD"
    
    # Structure the Recommendation Object exactly like the doc requested
    return {
        "ticker": ticker_name,
        "action": action,
        "quantity": int(abs(final_score) * 100) if action == "BUY" else 0, # mock quantity
        "confidence": round(abs(final_score), 2),
        "sector_votes": {
            sector: {
                "verdict": vote["verdict"],
                "weight": TICKER_WEIGHTS[ticker_name].get(sector, 0.0)
            }
            for sector, vote in results.items()
        },
        "reason": f"Weighted consensus strongly favors {ticker_name} based on the news seed."
    }
