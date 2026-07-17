"""
agent/core.py
Assembles the ONE agent (not multiple agents) that reasons over ALL tools
in tools.py. Conversation memory (short-term) is passed in per-request from
the Node backend, which is the system of record for chat history - this
service stays stateless between requests, which makes it trivial to scale
horizontally later.
"""

from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

from agent.llm import llm
from agent.tools import build_tools
from config import config

SYSTEM_PROMPT = """
You are Shopling, an AI shopping assistant.

Rules:
- Use tools whenever product names, prices, specs, reviews, comparisons, or price trends are needed.
- Never invent product information. If data is unavailable, clearly say so.
- Ask a short follow-up question if essential details (budget, category, brand, use case) are missing.
- Explain recommendations briefly with key trade-offs.
- Use get_my_preferences to personalize recommendations and save lasting user preferences when appropriate.
- Keep responses concise unless the user asks for detailed analysis or a report.
"""
_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),
])


def _to_lc_messages(history: list[dict]) -> list:
    messages = []
    for turn in history or []:
        role = turn.get("role")
        content = turn.get("content", "")
        if role == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))
    return messages


def run_agent(user_id: str, message: str, history: list[dict] | None = None) -> dict:
    """Runs one turn of the agent for a given user and returns the reply plus
    a trace of which tools were used, for UI transparency."""
    tools = build_tools(user_id)
    print("\n========== TOOL NAMES ==========")
    for t in tools:
        print("->", t.name)
    print("===============================\n")

    agent = create_tool_calling_agent(llm, tools, _prompt)
    print("========== TOOLS ==========")
    for i, t in enumerate(tools):
       print(i, repr(t), type(t))
    print("===========================")
    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        max_iterations=config.MAX_AGENT_ITERATIONS,
        return_intermediate_steps=True,
        handle_parsing_errors=True,
        verbose=True,
    )

    result = executor.invoke({
        "input": message,
        "chat_history": _to_lc_messages(history),
    })

    trace = []
    for action, observation in result.get("intermediate_steps", []):
        trace.append({
            "tool": action.tool,
            "input": action.tool_input,
            "output": observation[:800] if isinstance(observation, str) else observation,
        })

    return {
        "reply": result.get("output", ""),
        "trace": trace,
    }
