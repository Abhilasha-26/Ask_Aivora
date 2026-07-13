import { Bot, User } from "lucide-react";
import AgentTrace from "./AgentTrace.jsx";

// Matches http(s) URLs.
const URL_RE = /https?:\/\/[^\s]+/g;

/**
 * Removes sentence punctuation that isn't really part of the URL.
 */
function stripTrailingPunctuation(url) {
  let trailing = "";

  while (url.length > 0) {
    const lastChar = url[url.length - 1];

    if (/[.,!?;:]/.test(lastChar)) {
      trailing = lastChar + trailing;
      url = url.slice(0, -1);
      continue;
    }

    if (lastChar === ")" || lastChar === "]") {
      const openChar = lastChar === ")" ? "(" : "[";
      const opens = url.split(openChar).length - 1;
      const closes = url.split(lastChar).length - 1;

      if (closes > opens) {
        trailing = lastChar + trailing;
        url = url.slice(0, -1);
        continue;
      }
    }

    break;
  }

  return { url, trailing };
}

/**
 * Converts plain URLs into clickable links.
 */
function linkify(text) {
  if (!text) return text;

  const parts = [];
  let lastIndex = 0;
  let key = 0;
  let match;

  // Fresh regex instance every call
  const re = new RegExp(URL_RE.source, "g");

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const { url, trailing } = stripTrailingPunctuation(match[0]);

    if (start > lastIndex) {
      parts.push(
        <span key={key++}>
          {text.slice(lastIndex, start)}
        </span>
      );
    }

    parts.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-secondary break-all transition-colors"
      >
        {url}
      </a>
    );

    if (trailing) {
      parts.push(
        <span key={key++}>
          {trailing}
        </span>
      );
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

export default function ChatBubble({ role, content, trace, isLoading }) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-surface2"
            : "bg-gradient-to-br from-primary to-secondary shadow-glow"
        }`}
      >
        {isUser ? (
          <User size={15} className="text-textdim" />
        ) : (
          <Bot size={15} className="text-white" />
        )}
      </div>

      <div
        className={`max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
            isUser
              ? "bg-primary text-white"
              : "bg-surface border border-border text-textmain"
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-1 text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" />
            </span>
          ) : isUser ? (
            content
          ) : (
            linkify(content)
          )}
        </div>

        {!isUser && !isLoading && <AgentTrace trace={trace} />}
      </div>
    </div>
  );
}