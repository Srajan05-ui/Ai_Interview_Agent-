from datetime import datetime

class AntiCheatService:
    def __init__(self):
        self.warnings = 0
        
    def analyze_event(self, event_type: str, timestamp: datetime, data: dict = None) -> bool:
        """
        Returns True if cheating is suspected, False otherwise.
        For MVP, we flag tab switches or rapid copy-pastes.
        """
        if event_type == "tab_switch":
            self.warnings += 1
            return True
        elif event_type == "paste":
            # Heuristic: pasting large amounts of code quickly
            pasted_text = data.get("text", "")
            if len(pasted_text) > 100:
                self.warnings += 1
                return True
        return False
        
    def get_warnings(self) -> int:
        return self.warnings
