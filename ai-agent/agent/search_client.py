"""
agent/search_client.py
Thin wrapper around Tavily so every tool searches the web the same way.
This is the ONLY source of real-world product/price/review data the agent
ever sees - the LLM is only allowed to structure and reason over what
Tavily actually returns, never invent numbers of its own.
"""

from tavily import TavilyClient
from config import config

_client = TavilyClient(api_key=config.TAVILY_API_KEY) if config.TAVILY_API_KEY else None


def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Returns a list of {title, url, content} dicts, or [] if Tavily
    isn't configured / the search fails, so callers can handle that
    gracefully instead of crashing the agent turn."""
    if _client is None:
        return []
    try:
        response = _client.search(
            query=query,
            search_depth="advanced",
            max_results=max_results,
            include_answer=False,
        )
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", ""),
            }
            for r in response.get("results", [])
        ]
    except Exception as e:
        return [{"title": "search_error", "url": "", "content": str(e)}]


def has_tavily_key() -> bool:
    return _client is not None
