"""
agent/guardrails.py
Input guardrail - runs BEFORE the agent, on every incoming message.
Keeps the assistant on-topic (shopping only) instead of letting it answer
"write me a poem" or "what's the weather" just because the underlying LLM
technically can. Cheap regex pass first, LLM classifier only when unsure,
to avoid burning a model call on obviously-fine shopping messages.
"""

import re
from agent.llm import ask

# If the message clearly mentions shopping-ish concepts, skip the LLM call
_SHOPPING_HINTS = re.compile(
    r"\b(buy|price|budget|product|laptop|phone|mobile|headphone|earbud|shoe|"
    r"watch|tv|television|camera|review|compare|recommend|order|wishlist|"
    r"cart|deal|discount|spec|brand|₹|\$|rs\.?\d|under|cheap|budget)\b",
    re.IGNORECASE,
)

_CLASSIFIER_PROMPT = """You are a strict content classifier for a shopping-assistant chatbot.
Decide if the USER MESSAGE below is related to shopping, products, purchases,
comparisons, recommendations, reviews, budgets, or the assistant's own
capabilities (greetings, "what can you do", follow-up questions in an
ongoing shopping conversation also count as on-topic).

Reply with exactly one word: YES or NO.

USER MESSAGE: {message}
"""


def is_shopping_related(message: str) -> bool:
    if not message or not message.strip():
        return False

    if _SHOPPING_HINTS.search(message):
        return True

    # Greetings / short conversational turns are fine too - don't reject those
    if len(message.strip().split()) <= 4:
        return True

    try:
        verdict = ask(_CLASSIFIER_PROMPT.format(message=message)).strip().upper()
        return verdict.startswith("Y")
    except Exception:
        # If the classifier call fails, fail open rather than blocking the user
        return True


GUARDRAIL_REJECTION_MESSAGE = (
    "I'm your shopping assistant, so I can only help with things like finding "
    "products, comparing options, reviews, specs, budgets, and your orders or "
    "wishlist. Ask me something shopping-related and I'm happy to help!"
)
