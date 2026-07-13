import { useState } from "react";
import { ArrowUp } from "lucide-react";

const SUGGESTIONS = [
  "Gaming laptop under 80k",
  "Wireless earbuds under 2000",
  "What have I ordered before?",
  "Explain what DDR5 means",
];

export default function ChatInput({ onSend, isLoading }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-surface border border-border rounded-2xl p-2 focus-within:border-primary transition-colors"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Chat with AskAivora about anything shopping-related..."
          className="flex-1 bg-transparent outline-none px-3 py-2.5 text-sm placeholder:text-textdim"
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="w-10 h-10 shrink-0 rounded-xl bg-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:shadow-glow transition-shadow"
        >
          <ArrowUp size={18} className="text-white" />
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-textdim hover:border-primary hover:text-textmain transition-colors disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
