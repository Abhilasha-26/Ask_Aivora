"""
routes/chat.py
The single entry point the Node backend calls for every chat turn.
Protected by the shared internal secret - this service is never exposed
directly to the frontend/browser.
"""

from flask import Blueprint, request, jsonify
import traceback
from config import config
from agent.guardrails import is_shopping_related, GUARDRAIL_REJECTION_MESSAGE
from agent.core import run_agent

chat_bp = Blueprint("chat", __name__)


def _authorized(req) -> bool:
    secret = req.headers.get("X-Internal-Secret", "")
    return bool(config.INTERNAL_SERVICE_SECRET) and secret == config.INTERNAL_SERVICE_SECRET


@chat_bp.route("/agent/chat", methods=["POST"])
def agent_chat():
    if not _authorized(request):
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(silent=True) or {}
    user_id = body.get("userId")
    message = (body.get("message") or "").strip()
    history = body.get("history") or []

    if not user_id or not message:
        return jsonify({"error": "userId and message are required"}), 400

    # --- Input guardrail ---
    if not is_shopping_related(message):
        return jsonify({
            "reply": GUARDRAIL_REJECTION_MESSAGE,
            "trace": [{"tool": "guardrail", "input": message, "output": "rejected: off-topic"}],
            "blocked": True,
        })
    try:
        result = run_agent(
            user_id=user_id,
            message=message,
            history=history,
        )

        return jsonify({
            "reply": result["reply"],
            "trace": result["trace"],
            "blocked": False,
        })

    except Exception as e:
        print("\n" + "=" * 80)
        print("AGENT ERROR")
        print("=" * 80)
        print("Type:", type(e))
        print("Message:", str(e))

        if hasattr(e, "body"):
            print("\nBODY:")
            print(e.body)

        if hasattr(e, "response"):
            print("\nRESPONSE:")
            print(e.response)

        print("\nARGS:")
        print(e.args)

        print("\nDICT:")
        print(getattr(e, "__dict__", {}))

        traceback.print_exc()

        return jsonify({
            "error": "Agent failed to process the request",
            "detail": str(e),
        }), 500
    # try:
    #     result = run_agent(user_id=user_id, message=message, history=history)
    # except Exception as e:
    #     traceback.print_exc()
    #     return jsonify({"error": "Agent failed to process the request", "detail": str(e)}), 500

    # return jsonify({"reply": result["reply"], "trace": result["trace"], "blocked": False})
      