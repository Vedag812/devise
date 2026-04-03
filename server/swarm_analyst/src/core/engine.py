import asyncio
import json
from typing import List, Callable, Awaitable, Optional
from src.core.config import get_genai_client, settings
from src.core.models import AnalystResult
from src.services.generator import DynamicPersona

async def run_dynamic_analyst(
    persona: DynamicPersona, 
    seed: str, 
    goal: str,
    on_result: Callable[[AnalystResult], Awaitable[None]] = None
) -> AnalystResult:
    """
    Runs a specialized dynamic analyst architected by the Genesis Engine.
    """
    try:
        client = get_genai_client()
        
        prompt = f"""
        ROLE: {persona.role}
        LENS: {persona.lens}
        
        {persona.specialized_prompt}
        
        CONTEXT_SEED:
        {seed}
        
        GOAL:
        {goal}
        
        REASONING_PROTOCOL:
        1. Start with an internal monologue inside <thought> tags. 
        2. Analyze the specific data points requested in your SPECIALIZED_PROMPT.
        3. End with a JSON verdict.
        
        Return JSON structure:
        {{
            "sector": "{persona.role}",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence summary for the swarm coordinator",
            "thought": "Your internal monologue from above"
        }}
        """
        
        full_response = ""
        for chunk in client.models.generate_content_stream(
            model=settings.DEFAULT_MODEL,
            contents=prompt
        ):
            text = chunk.text
            full_response += text

        # Parse final structured result
        json_part = full_response.split("</thought>")[-1].strip()
        json_part = json_part.replace("```json", "").replace("```", "")
        data = json.loads(json_part)
        
        thought = ""
        if "<thought>" in full_response and "</thought>" in full_response:
            thought = full_response.split("<thought>")[1].split("</thought>")[0].strip()
        
        result = AnalystResult(**data, thought=thought)
        if on_result:
            await on_result(result)
        return result
    except Exception as e:
        err_res = AnalystResult(
            sector=persona.role,
            verdict="NEUTRAL",
            confidence=0.5,
            reasoning=f"Simulation Failure: {str(e)}",
            thought="Node offline due to reasoning exception."
        )
        if on_result:
            await on_result(err_res)
        return err_res

async def run_simulation(
    personas: List[DynamicPersona], 
    seed: str, 
    goal: str,
    on_result: Callable[[AnalystResult], Awaitable[None]] = None
) -> List[AnalystResult]:
    """
    Launches the dynamic parallel simulation loop.
    """
    tasks = [run_dynamic_analyst(p, seed, goal, on_result) for p in personas]
    results = await asyncio.gather(*tasks)
    return list(results)
