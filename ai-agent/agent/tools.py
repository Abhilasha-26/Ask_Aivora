"""
agent/tools.py
Every capability the agent has, as a LangChain tool. This is ONE agent with
MANY tools (not multiple agents) - the LLM decides which tool(s) to call
and in what order based on the conversation, per user turn.

Each tool is built inside `build_tools(user_id)` so tools that touch
per-user data (preferences, wishlist, orders) are safely bound to the
authenticated user making the request - the LLM is never trusted to
supply its own user_id.

Golden rule enforced throughout: tools only ever return data that came
from Tavily search results or the Node backend. The LLM is used to
STRUCTURE and EXPLAIN that data, never to invent prices or specs.
"""

import json
from typing import Optional, List

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from agent.llm import ask
from agent.search_client import web_search, has_tavily_key
from agent import backend_client as backend

# A small curated glossary so common spec terms get instant, reliable
# answers without a model call; anything not listed falls back to the LLM's
# general knowledge (safe for definitions - the risk is only around
# product-specific prices/specs, not "what is OLED").
_SPEC_GLOSSARY = {
    "oled": "OLED (Organic Light-Emitting Diode) - each pixel emits its own light, "
            "giving true blacks and very high contrast, at the cost of higher price "
            "and some risk of long-term burn-in.",
    "ddr5": "DDR5 - the newest generation of RAM, faster and more power-efficient than "
            "DDR4, but currently costs more and needs a compatible motherboard/CPU.",
    "ddr4": "DDR4 - the previous-generation RAM standard, cheaper than DDR5 and still "
            "plenty fast for most everyday and gaming use.",
    "ryzen": "AMD Ryzen - AMD's CPU lineup (Ryzen 3/5/7/9), generally strong "
             "multi-core performance and value per rupee/dollar vs equivalent Intel chips.",
    "amoled": "AMOLED - a variant of OLED common on phones; vivid colors and true "
              "blacks, very good for media and gaming, uses less power on dark UIs.",
    "ips lcd": "IPS LCD - a backlit LCD panel with good, consistent colors and viewing "
               "angles but not as deep blacks or contrast as OLED/AMOLED.",
    "refresh rate": "Refresh rate (Hz) - how many times per second the screen redraws. "
                     "90/120Hz+ feels noticeably smoother for scrolling and gaming than 60Hz.",
    "nvme ssd": "NVMe SSD - a solid-state drive connected via PCIe, several times "
                "faster than older SATA SSDs for boot and load times.",
}

# Fallback used whenever we can't determine the user's country (backend
# unreachable, preference not set yet, etc.) - keeps the tool functional
# even if the preferences call fails.
_DEFAULT_COUNTRY = "India"


# ---------------------------------------------------------------------------
# 1. Product search
# ---------------------------------------------------------------------------
class SearchProductsInput(BaseModel):
    query: str = Field(
        description="""
Complete shopping request exactly as the user wrote it.

Examples:
- Gaming laptop under 80000 INR
- 55 inch 4K Smart TV
- Best phone under 30000
- iPhone 16 Pro
"""
    )


def _make_search_products_tool(country: str):
    """country is resolved once per request in build_tools() from the user's
    stored preference (set at registration), so every search this tool makes
    is scoped to that user's market without re-fetching it on every call."""

    @tool("search_products", args_schema=SearchProductsInput)
    def search_products(query: str) -> str:
        """
        Search the live web for real, currently-available products matching the
        user's request. Always use this before recommending or comparing specific
        products. Never invent product names, prices, or specs from memory.
        """

        # Check if Tavily is configured
        if not has_tavily_key():
            return json.dumps({
                "error": "Tavily is not configured on this server."
            })

        # Country-aware search query - keeps prices/availability relevant to
        # the market the user actually shops in.
        search_query = f"{query} {country} latest buy price specifications reviews"

        print(f"\nSearching products for: {search_query}")

        # Search the web
        raw = web_search(search_query, max_results=8)

        print("Raw Tavily results:", raw)

        if not raw:
            return json.dumps({
                "products": [],
                "note": "No web results found."
            })

        # Safe extraction - never assume title/url/content exist on a result
        snippet_lines = []
        for r in raw:
            title = r.get("title") or "Untitled"
            url = r.get("url") or ""
            content = (r.get("content") or "")[:250]
            if not content:
                # Nothing usable to extract from this result - skip it
                continue
            snippet_lines.append(f"[{title}]({url}): {content}")

        if not snippet_lines:
            return json.dumps({
                "products": [],
                "note": "Search results had no usable content."
            })

        snippets = "\n\n".join(snippet_lines)

        # Convert search results into a prompt
        prompt = f"""
Extract up to 5 real products matching:

{query}
Market: {country}

Use ONLY the snippets below.

Return ONLY a valid JSON array:

[
 {{
   "name":"",
   "brand":"",
   "price":null,
   "currency":"",
   "rating":null,
   "key_specs":"",
   "availability":"",
   "source_url":""
 }}
]

If a field is missing, use null.
Do not invent information.

SNIPPETS:
{snippets}
"""

        print("Calling LLM to structure search results...")

        try:
            raw_json = ask(prompt).strip()
        except Exception as e:
            print("LLM call failed:", e)
            return json.dumps({
                "products": [],
                "note": "Product extraction failed (LLM error)."
            })

        print("LLM output:")
        print(raw_json)

        # Remove markdown if present
        raw_json = (
            raw_json.removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )

        try:
            products = json.loads(raw_json)
            if not isinstance(products, list):
                raise ValueError("Expected a JSON array of products.")
        except (json.JSONDecodeError, ValueError) as e:
            print("JSON parsing failed:", e)
            print("Model returned:")
            print(raw_json)

            products = []

        return json.dumps({"products": products})

    return search_products

# ---------------------------------------------------------------------------
# 2. Compare products
# ---------------------------------------------------------------------------
class CompareProductsInput(BaseModel):
    products: List[dict] = Field(description="List of product objects (from a prior search_products call) to compare, each with name/price/key_specs/rating")


def _make_compare_products_tool():
    @tool("compare_products", args_schema=CompareProductsInput)
    def compare_products(products: List[dict]) -> str:
        """Compare a list of already-found products side by side and compute a
        simple value score for each (rating relative to price). Use this after
        search_products when the user wants a comparison."""
        rows = []
        priced = [p for p in products if isinstance(p.get("price"), (int, float)) and p["price"] > 0]
        max_price = max((p["price"] for p in priced), default=0)
        for p in products:
            price = p.get("price")
            rating = p.get("rating") or 0
            value_score = None
            if isinstance(price, (int, float)) and price > 0 and max_price:
                # Cheaper + higher rated = higher score, normalized 0-10
                price_score = (1 - (price / max_price)) * 5
                rating_score = (rating / 5) * 5 if rating else 2.5
                value_score = round(price_score + rating_score, 1)
            rows.append({**p, "value_score": value_score})
        rows.sort(key=lambda r: (r["value_score"] is None, -(r["value_score"] or 0)))
        return json.dumps({"comparison": rows})

    return compare_products


# ---------------------------------------------------------------------------
# 3. Review summarizer
# ---------------------------------------------------------------------------
class SummarizeReviewsInput(BaseModel):
    product_name: str = Field(description="Exact product name to find reviews for")


def _make_summarize_reviews_tool():
    @tool("summarize_reviews", args_schema=SummarizeReviewsInput)
    def summarize_reviews(product_name: str) -> str:
        """Search for real customer reviews of a specific product and summarize
        them into pros, cons, and common complaints. Use before recommending a
        product so the recommendation is backed by real user feedback."""
        raw = web_search(f"{product_name} review pros cons complaints", max_results=6)
        if not raw:
            return json.dumps({"error": "No review data found for this product."})
        snippets = "\n\n".join(f"{r['title']}: {r['content'][:400]}" for r in raw)
        prompt = f"""Based ONLY on the review snippets below for "{product_name}",
summarize them. Return ONLY valid JSON (no markdown) with keys:
pros (list of short strings), cons (list of short strings),
common_complaints (list of short strings), overall_sentiment (one of: positive, mixed, negative).
If the snippets don't have enough info for a field, use an empty list.

SNIPPETS:
{snippets}
"""
        raw_json = ask(prompt).strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            summary = json.loads(raw_json)
        except json.JSONDecodeError:
            summary = {"error": "Could not parse review summary."}
        return json.dumps(summary)

    return summarize_reviews


# ---------------------------------------------------------------------------
# 4. Spec explainer
# ---------------------------------------------------------------------------
class ExplainSpecInput(BaseModel):
    term: str = Field(description="A technical spec or term to explain, e.g. 'OLED', 'DDR5', 'Ryzen 7'")


def _make_explain_spec_tool():
    @tool("explain_tech_spec", args_schema=ExplainSpecInput)
    def explain_tech_spec(term: str) -> str:
        """Explain a technical spec or term (OLED, DDR5, Ryzen, refresh rate, etc.)
        in plain, beginner-friendly language. Use when the user seems unsure what
        a spec means, not for product-specific prices."""
        key = term.strip().lower()
        if key in _SPEC_GLOSSARY:
            return _SPEC_GLOSSARY[key]
        prompt = (
            f"Explain the tech term '{term}' in 2-3 simple sentences for a non-technical "
            f"shopper, including one practical trade-off (cost, performance, etc.). "
            f"Do not mention any specific product prices."
        )
        return ask(prompt)

    return explain_tech_spec


# ---------------------------------------------------------------------------
# 5. Shopping planner
# ---------------------------------------------------------------------------
class ShoppingPlannerInput(BaseModel):
    budget: float = Field(description="Total budget the user has")
    category: str = Field(description="What they're shopping for, e.g. 'gaming setup', 'home office'")
    currency: Optional[str] = Field(default="INR")


def _make_shopping_planner_tool():
    @tool("shopping_planner", args_schema=ShoppingPlannerInput)
    def shopping_planner(budget: float, category: str, currency: str = "INR") -> str:
        """Given a total budget and a shopping category, propose a sensible
        breakdown of how to allocate the budget across the main item and
        accessories/essentials. Returns percentages and rough amounts, not
        exact prices - always follow up with search_products for real options."""
        prompt = f"""A shopper has a budget of {budget} {currency} for "{category}".
Propose a sensible budget allocation across 3-5 line items (e.g. main product,
essential accessories, extras). Return ONLY valid JSON (no markdown) as a list
of objects with keys: item, percent_of_budget, approx_amount, reason.
Percentages must sum to 100. Keep reasons to one short sentence.
"""
        raw_json = ask(prompt).strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            plan = json.loads(raw_json)
        except json.JSONDecodeError:
            plan = {"error": "Could not generate plan."}
        return json.dumps({"budget": budget, "currency": currency, "plan": plan})

    return shopping_planner


# ---------------------------------------------------------------------------
# 6. Accessory recommender
# ---------------------------------------------------------------------------
class RecommendAccessoriesInput(BaseModel):
    product_name: str = Field(description="The main product the user is buying or owns")
    budget: Optional[float] = Field(default=None, description="Optional extra budget for accessories")


def _make_recommend_accessories_tool():
    @tool("recommend_accessories", args_schema=RecommendAccessoriesInput)
    def recommend_accessories(product_name: str, budget: Optional[float] = None) -> str:
        """Search for and suggest real accessories commonly bought with a given
        product (e.g. a case/charger for a phone, a mouse/mat for a gaming laptop)."""
        budget_text = f" under {budget}" if budget else ""
        raw = web_search(f"best accessories for {product_name}{budget_text}", max_results=6)
        if not raw:
            return json.dumps({"accessories": [], "note": "No accessory data found."})
        snippets = "\n\n".join(f"{r['title']}: {r['content'][:300]}" for r in raw)
        prompt = f"""From these snippets, list up to 5 real accessory suggestions for
"{product_name}". Return ONLY valid JSON (no markdown) as a list of objects with
keys: name, why (one short sentence), approx_price (or null if unknown).

SNIPPETS:
{snippets}
"""
        raw_json = ask(prompt).strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            accessories = json.loads(raw_json)
        except json.JSONDecodeError:
            accessories = []
        return json.dumps({"accessories": accessories})

    return recommend_accessories


# ---------------------------------------------------------------------------
# 7. Price insight (buy now / wait)
# ---------------------------------------------------------------------------
class PriceInsightInput(BaseModel):
    product_name: str = Field(description="Product to check price trends/deals for")


def _make_price_insight_tool():
    @tool("price_insight", args_schema=PriceInsightInput)
    def price_insight(product_name: str) -> str:
        """Look up recent price/deal signals for a product and give a buy-now-or-wait
        opinion. This is a heuristic estimate from public info, never a guarantee -
        always say so in the response."""
        raw = web_search(f"{product_name} price drop sale deal history", max_results=6)
        if not raw:
            return json.dumps({"error": "No price trend data found."})
        snippets = "\n\n".join(f"{r['title']}: {r['content'][:400]}" for r in raw)
        prompt = f"""Based ONLY on the snippets below about "{product_name}" pricing/deals,
give a buy-now-or-wait opinion. Return ONLY valid JSON (no markdown) with keys:
verdict (one of: "buy_now", "wait", "unclear"), confidence (0-100 integer),
reasoning (1-2 short sentences), caveat (a short sentence noting this is an
estimate from public info, not a guarantee).

SNIPPETS:
{snippets}
"""
        raw_json = ask(prompt).strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            insight = json.loads(raw_json)
        except json.JSONDecodeError:
            insight = {"verdict": "unclear", "confidence": 0, "reasoning": "Could not parse insight."}
        return json.dumps(insight)

    return price_insight


# ---------------------------------------------------------------------------
# 8. Decision report
# ---------------------------------------------------------------------------
class DecisionReportInput(BaseModel):
    product_name: str
    price: Optional[float] = None
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    rating: Optional[float] = Field(default=None, description="Out of 5, if known")


def _make_decision_report_tool():
    @tool("generate_decision_report", args_schema=DecisionReportInput)
    def generate_decision_report(
        product_name: str,
        price: Optional[float] = None,
        pros: Optional[List[str]] = None,
        cons: Optional[List[str]] = None,
        rating: Optional[float] = None,
    ) -> str:
        """Produce a final structured decision report with a confidence score,
        once search/compare/review-summary tools have already been used. Use
        this as the last step before giving the user a final recommendation."""
        pros = pros or []
        cons = cons or []
        # Simple transparent confidence heuristic - not a black box:
        # more pros than cons, a decent rating, and having a real price all raise confidence.
        score = 50
        score += min(len(pros) * 6, 24)
        score -= min(len(cons) * 5, 20)
        if rating:
            score += (rating - 3) * 8
        if price:
            score += 5
        confidence = max(5, min(95, round(score)))

        return json.dumps({
            "product_name": product_name,
            "price": price,
            "pros": pros,
            "cons": cons,
            "confidence_score": confidence,
            "confidence_note": "Heuristic based on review balance, rating, and data completeness - not a certainty.",
        })

    return generate_decision_report


# ---------------------------------------------------------------------------
# 9-10. User preference memory (backed by the Node/Mongo backend)
# ---------------------------------------------------------------------------
class SavePreferenceInput(BaseModel):
    key: str = Field(description="Preference name, e.g. 'preferred_brands', 'max_budget', 'organic_only'")
    value: str = Field(description="The value to remember")

class GetPreferencesInput(BaseModel):
    request: str = Field(
        default="preferences",
        description="Ignored. Used only to satisfy tool calling."
    )

def _make_get_preferences_tool(user_id: str):
    @tool("get_my_preferences",args_schema=GetPreferencesInput)
    def get_my_preferences(request: str = "preferences") -> str:
        """Look up this user's remembered shopping preferences (budget limits,
        preferred brands, must-avoid items, etc). Call this early in a
        conversation so you don't ask for things the user already told you before."""
        return json.dumps(backend.get_preferences(user_id))

    return get_my_preferences


def _make_save_preference_tool(user_id: str):
    @tool("save_my_preference", args_schema=SavePreferenceInput)
    def save_my_preference(key: str, value: str) -> str:
        """Remember a shopping preference the user just stated (e.g. 'always
        wants organic', 'never over $20', 'prefers Samsung'), so they never
        have to repeat it in a future session."""
        return json.dumps(backend.update_preferences(user_id, {key: value}))

    return save_my_preference


# ---------------------------------------------------------------------------
# 11. Order history
# ---------------------------------------------------------------------------
class OrderHistoryInput(BaseModel):
    dummy: str = Field(
        default="history",
        description="Ignored. Used only for tool invocation."
    )
def _make_order_history_tool(user_id: str):
    @tool("get_order_history",args_schema=OrderHistoryInput)
    def get_order_history(dummy: str = "history") -> str:
        """Look up this user's past orders, to answer questions like
        'what have I ordered before?' or to avoid recommending a duplicate."""
        return json.dumps({"orders": backend.get_orders(user_id)})

    return get_order_history


# ---------------------------------------------------------------------------
# 12. Wishlist management
# ---------------------------------------------------------------------------
class WishlistInput(BaseModel):
    action: str = Field(description="One of: 'add', 'remove', 'list'")
    product_name: Optional[str] = Field(default=None)
    price: Optional[float] = Field(default=None)
    url: Optional[str] = Field(default=None)


def _make_wishlist_tool(user_id: str):
    @tool("manage_wishlist", args_schema=WishlistInput)
    def manage_wishlist(action: str, product_name: Optional[str] = None, price: Optional[float] = None, url: Optional[str] = None) -> str:
        """Add to, remove from, or list the user's wishlist. Use 'add' when the
        user says something like 'save this' or 'add to my wishlist'."""
        action = action.lower().strip()
        if action == "list":
            return json.dumps({"items": backend.get_wishlist(user_id)})
        if action == "add":
            if not product_name:
                return json.dumps({"error": "product_name is required to add to wishlist."})
            return json.dumps(backend.add_to_wishlist(user_id, {"productName": product_name, "price": price, "url": url}))
        if action == "remove":
            if not product_name:
                return json.dumps({"error": "product_name is required to remove from wishlist."})
            return json.dumps(backend.remove_from_wishlist(user_id, product_name))
        return json.dumps({"error": f"Unknown action '{action}'."})

    return manage_wishlist


def _resolve_country(user_id: str) -> str:
    """Fetches the user's country (set at registration, stored as a normal
    preference key) once per request. Falls back to _DEFAULT_COUNTRY if the
    preference isn't set yet or the backend call fails, so search_products
    never breaks because of this."""
    prefs = backend.get_preferences(user_id)
    country = prefs.get("country") if isinstance(prefs, dict) else None
    return country or _DEFAULT_COUNTRY


# ---------------------------------------------------------------------------
def build_tools(user_id: str) -> list:
    """Assembles the full toolset for one authenticated user's request."""
    country = _resolve_country(user_id)

    return [
         _make_search_products_tool(country),
         _make_compare_products_tool(),
         _make_summarize_reviews_tool(),
         _make_explain_spec_tool(),
         _make_shopping_planner_tool(),
         _make_recommend_accessories_tool(),
         _make_price_insight_tool(),
         _make_decision_report_tool(),
         _make_get_preferences_tool(user_id),
         _make_save_preference_tool(user_id),
         _make_order_history_tool(user_id),
         _make_wishlist_tool(user_id),
    ]