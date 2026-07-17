"""
app.py
Entry point for the AI microservice (Flask). Owns ALL AI/agent logic.
The Node backend is the only client of this service - it is never called
directly by the frontend.

Run:
    python app.py                 (dev)
    gunicorn -b 0.0.0.0:5001 app:app   (prod)
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config import config
from routes.chat import chat_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(chat_bp)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok",
            "service": "shopping-agent-ai",
            "tavily_configured": bool(config.TAVILY_API_KEY),
            "groq_configured": bool(config.GROQ_API_KEY),
        })

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=True)
