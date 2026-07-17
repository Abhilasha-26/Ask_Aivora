"""
agent/backend_client.py
All AI logic lives in this Python service, but user data (accounts,
preferences, wishlist, orders) is owned by the Node/MongoDB backend.
Tools that need that data call these small wrappers instead of hitting
MongoDB directly, keeping a clean separation of responsibilities and a
single source of truth for user data.

Every call is authenticated with a shared-secret header so the two
services trust each other without exposing these routes publicly.
"""

import requests
from config import config

_HEADERS = {
    "Content-Type": "application/json",
    "X-Internal-Secret": config.INTERNAL_SERVICE_SECRET,
}


def _url(path: str) -> str:
    return f"{config.NODE_BACKEND_URL}/internal{path}"


def get_preferences(user_id: str) -> dict:
    try:
        r = requests.get(_url(f"/users/{user_id}/preferences"), headers=_HEADERS, timeout=8)
        r.raise_for_status()
        return r.json().get("preferences", {})
    except Exception as e:
        return {"error": str(e)}


def update_preferences(user_id: str, updates: dict) -> dict:
    try:
        r = requests.put(_url(f"/users/{user_id}/preferences"), json={"updates": updates}, headers=_HEADERS, timeout=8)
        r.raise_for_status()
        return r.json().get("preferences", {})
    except Exception as e:
        return {"error": str(e)}


def get_orders(user_id: str) -> list:
    try:
        r = requests.get(_url(f"/users/{user_id}/orders"), headers=_HEADERS, timeout=8)
        r.raise_for_status()
        return r.json().get("orders", [])
    except Exception as e:
        return [{"error": str(e)}]


def get_wishlist(user_id: str) -> list:
    try:
        r = requests.get(_url(f"/users/{user_id}/wishlist"), headers=_HEADERS, timeout=8)
        r.raise_for_status()
        return r.json().get("items", [])
    except Exception as e:
        return [{"error": str(e)}]


def add_to_wishlist(user_id: str, item: dict) -> dict:
    try:
        r = requests.post(_url(f"/users/{user_id}/wishlist"), json=item, headers=_HEADERS, timeout=8)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def remove_from_wishlist(user_id: str, product_name: str) -> dict:
    try:
        r = requests.delete(
            _url(f"/users/{user_id}/wishlist"),
            json={"productName": product_name},
            headers=_HEADERS,
            timeout=8,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}
