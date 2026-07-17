"""
agent/llm.py
The "brain" the agent and every tool that needs raw LLM reasoning share.
Groq is used for its generous free tier and very low latency, which
matters for an agent that may chain several tool calls in one turn.
"""

from langchain_groq import ChatGroq
from config import config

llm = ChatGroq(
    api_key=config.GROQ_API_KEY,
    model=config.GROQ_MODEL,
    temperature=0.3,  # low temperature -> consistent, factual, less "creative" pricing/specs
)


def ask(prompt: str) -> str:
    """Small helper for tools that just need a one-shot LLM completion
    rather than the full tool-calling agent."""
    response = llm.invoke(prompt)
    return response.content
