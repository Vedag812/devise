import json
from typing import List, Dict, Any
from pydantic import BaseModel
from src.core.config import get_genai_client, settings
from src.utils.logger import get_logger

logger = get_logger("swarm.generator")

class DynamicPersona(BaseModel):
    role: str
    lens: str
    specialized_prompt: str

GENERATOR_PROMPT = """
You are the MICRO_FISH GENESIS ENGINE. 
Your task is to analyze the SEED_MATERIAL and GOAL provided below to architect a specialized Swarm of 5-8 autonomous analysts.

SEED_MATERIAL:
{seed}

GOAL:
{goal}

For this specific scenario, identify the most critical perspectives required for a high-fidelity prediction.
For each analyst, define:
1. ROLE: A tactical title (e.g., "Macro_Economist", "Hardware_Engineer", "Geopolitical_Strategist").
2. LENS: Their specific domain focus for this scenario.
3. SPECIALIZED_PROMPT: A custom system instruction that forces them to look at specific data points related to the seed.

Return ONLY a JSON list of objects:
[
  {{
    "role": "RoleName",
    "lens": "Concentrated domain focus",
    "specialized_prompt": "Detailed instructions on what catalysts to prioritize"
  }}
]
"""

async def generate_swarm_composition(seed: str, goal: str) -> List[DynamicPersona]:
    """
    Autonomously architects a swarm based on input materials.
    """
    try:
        client = get_genai_client()
        prompt = GENERATOR_PROMPT.format(seed=seed, goal=goal)
        
        response = client.models.generate_content(
            model=settings.DEFAULT_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )
        
        data = json.loads(response.text)
        return [DynamicPersona(**item) for item in data]
    except Exception as e:
        logger.error(f"Failed to generate dynamic swarm: {e}")
        # Fallback to a basic composition if generation fails
        return [
            DynamicPersona(
                role="General_Analyst", 
                lens="Synthesizing all available signals",
                specialized_prompt="Analyze the core catalysts in the provided data."
            )
        ]
