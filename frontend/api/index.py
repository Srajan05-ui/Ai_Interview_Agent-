import sys
import os

# Add the parent directory (root of the repo) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app.main import app
