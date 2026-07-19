# Shopling — AI Shopping Agent

A conversational AI shopping assistant built as three independent services:

```
shopping-agent/
├── ai-agent/     Python + Flask - ALL AI/agent logic lives here (LangChain, one tool-calling agent, Tavily, Groq)
├── backend/      Node.js + Express + MongoDB - auth, chat history, preferences, wishlist, orders
└── frontend/     React + Vite + Tailwind - chat UI, wishlist, auth
```

## Architecture

```
 Browser (React)
      │  JWT
      ▼
 Node/Express Backend  ──────────────►  MongoDB
      │  (users, chat history, prefs, wishlist, orders)
      │
      │  X-Internal-Secret header
      ▼
 Flask AI Microservice
      │  ONE LangChain tool-calling agent, MULTIPLE tools
      │
      ├──► Tavily API        (real-time product search, reviews, price trends)
      ├──► Groq LLM          (reasoning, extraction, summarization)
      └──► calls back into Node's /internal/* routes
            for preferences / wishlist / order history
```

**Why this shape?** The frontend never talks to the AI service directly, and the
AI service never touches MongoDB directly - it always reads/writes user data
through the Node backend's internal API (protected by a shared secret). This
keeps a clean separation: Node owns user data and auth, Flask owns AI
reasoning, and each can be scaled, deployed or replaced independently.

**Why ONE agent with many tools (not multiple agents)?** A single
`AgentExecutor` decides for itself which of the 12 tools to call, in what
order, based on the conversation - the same way a human personal shopper
would search, compare, then explain. This is simpler to reason about, debug,
and demo than orchestrating multiple cooperating agents, while still being
genuinely agentic (autonomous multi-step tool use, not a fixed pipeline).

## Features

**Conversational agent (ai-agent, Python/Flask/LangChain)**

- Natural, follow-up-driven shopping conversation (not a rigid form)
- Real product search via Tavily (never hallucinated prices/specs)
- Product comparison with a transparent value score
- Review summarization (pros / cons / common complaints)
- Spec explainer (OLED, DDR5, Ryzen, refresh rate, ...)
- Budget-based shopping planner
- Accessory recommendations
- Price insight (buy now vs. wait) with an explicit "estimate, not a guarantee" caveat
- Decision report with a transparent confidence score
- Long-term preference memory (budget, brands, must-haves) via the backend
- Order history & wishlist lookups, mid-conversation
- Input guardrail - politely declines non-shopping requests

**Backend (Node/Express + MongoDB)**

- JWT authentication (register/login)
- Persisted chat history (used as the agent's short-term memory)
- Preferences, wishlist, and order history CRUD
- `/internal/*` routes the Flask service uses to read/write that data,
  protected by a shared-secret header

**Frontend (React + Vite + Tailwind)**

- Chat interface with a live tool-call trace per reply
- Wishlist page
- Auth pages (login/register)

## Setup

You'll need: Node 18+, Python 3.10+, MongoDB (local or Atlas), a free
[Groq API key](https://console.groq.com/keys), and a free
[Tavily API key](https://app.tavily.com).

### 1. ai-agent (Flask)

```bash
cd ai-agent
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY, TAVILY_API_KEY, INTERNAL_SERVICE_SECRET
python app.py           # runs on http://localhost:5001
```

### 2. backend (Node/Express)

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, INTERNAL_SERVICE_SECRET (same as above)
npm run dev             # runs on http://localhost:5005
npm run seed             # optional: creates demo@example.com / demo1234 with sample data
```

### 3. frontend (React)

```bash
cd frontend
npm install
npm run dev              # runs on http://localhost:5173
```

`INTERNAL_SERVICE_SECRET` must be identical in `ai-agent/.env` and
`backend/.env` - it's what lets the two services trust each other's
server-to-server calls.

## Notes for the interview

- The agent's "no hallucination" guarantee is enforced structurally: every
  tool that could involve a price or spec sources it from a Tavily search
  result and instructs the LLM to extract-only (never estimate); the LLM is
  only trusted to explain, summarize, and reason over data it was actually given.
- `AgentExecutor(max_iterations=8, return_intermediate_steps=True)` caps
  runaway tool loops and gives the frontend a full trace of what the agent did.
- The guardrail is a cheap regex pass first, falling back to a single LLM
  classifier call only when a message doesn't obviously look shopping-related,
  to avoid burning a model call on every message.
