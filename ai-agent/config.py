"""
config.py
Loads and centralizes all environment configuration for the AI microservice.
Every other module reads settings from here instead of calling os.getenv()
directly, so there's a single source of truth and it's obvious at a glance
what this service depends on.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

    NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5005")
    INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "")

    PORT = int(os.getenv("PORT", 5001))

    # Safety cap on how many tool calls the agent can chain in one turn,
    # so a confused agent can't loop forever and burn API quota.
    MAX_AGENT_ITERATIONS = 8


config = Config()
