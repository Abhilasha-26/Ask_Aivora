import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import ChatInput from "../components/ChatInput.jsx";
import ChatBubble from "../components/ChatBubble.jsx";
import api from "../api.js";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get("/chat/history")
      .then(({ data }) => {
        setMessages(
          data.messages.map((m) => ({ role: m.role, content: m.content, trace: m.trace }))
        );
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (message) => {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);
    try {
      const { data } = await api.post("/chat", { message });
      console.log(data);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, trace: data.trace }]);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const showHero = historyLoaded && messages.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 flex flex-col min-h-[calc(100vh-88px)]">
      {showHero && (
        <div className="text-center max-w-xl mx-auto mb-10 mt-6 animate-[fadeIn_0.5s_ease-out]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-full mb-4">
            <Sparkles size={12} /> One agent · Many tools · Real-time web search
          </span>
          <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight tracking-tight">
            Tell it what you want.<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              It does the shopping.
            </span>
          </h1>
          <p className="text-textdim mt-4 text-sm leading-relaxed">
            AskAivora searches the live web, compares options, reads real reviews, remembers
            your preferences, and tells you exactly what to buy — and why.
          </p>
        </div>
      )}

      <div className="flex-1 space-y-5 mb-6">
        {messages.map((m, i) => (
          <div key={i} className="animate-[fadeInUp_0.25s_ease-out]">
            <ChatBubble role={m.role} content={m.content} trace={m.trace} />
          </div>
        ))}
        {isLoading && <ChatBubble role="assistant" isLoading />}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-center mb-3">
          <p className="inline-block text-sm text-warn bg-warn/10 border border-warn/20 px-3 py-1.5 rounded-lg">
            {error}
          </p>
        </div>
      )}

      <div className="sticky bottom-6">
        <div className="rounded-2xl bg-bg/80 backdrop-blur-sm">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}