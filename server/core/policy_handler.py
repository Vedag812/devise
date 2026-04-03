import yaml
import os
from pathlib import Path

class DevicePolicy:
    def __init__(self, policy_path: str = "policy.yaml"):
        # Resolve path relative to the server root
        base_dir = Path(__file__).parent.parent
        full_path = os.path.join(base_dir, policy_path)
        
        with open(full_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.policy = self.config.get("policy", {})
        self.delegation = self.config.get("delegation", {})

    def get_ticker_universe(self):
        return self.policy.get("ticker_universe", [])
        
    def get_max_order_size(self):
        return self.policy.get("max_order_size", 0)

    def is_tool_forbidden(self, tool_name: str) -> bool:
        forbidden = self.policy.get("forbidden_tools", [])
        return tool_name in forbidden

    def get_delegation_rules(self, link: str = "risk_to_trader"):
        return self.delegation.get(link, {})

# Singleton instance
device_policy = DevicePolicy()
