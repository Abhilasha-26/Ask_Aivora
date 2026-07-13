import { useState } from "react";
import {
  Search, ScanSearch, MessageSquareText, Sparkles, BookOpen,
  Wallet, Package, TrendingUp, FileCheck2, User, Heart, ShoppingBag, Wrench, ChevronDown,
} from "lucide-react";

const TOOL_META = {
  search_products: { icon: Search, label: "Searching products" },
  compare_products: { icon: ScanSearch, label: "Comparing products" },
  summarize_reviews: { icon: MessageSquareText, label: "Reading reviews" },
  explain_tech_spec: { icon: BookOpen, label: "Explaining a spec" },
  shopping_planner: { icon: Wallet, label: "Planning your budget" },
  recommend_accessories: { icon: Package, label: "Finding accessories" },
  price_insight: { icon: TrendingUp, label: "Checking price trends" },
  generate_decision_report: { icon: FileCheck2, label: "Building decision report" },
  get_my_preferences: { icon: User, label: "Checking your preferences" },
  save_my_preference: { icon: User, label: "Remembering your preference" },
  get_order_history: { icon: ShoppingBag, label: "Checking order history" },
  manage_wishlist: { icon: Heart, label: "Updating wishlist" },
};

export default function AgentTrace({ trace }) {
  const [open, setOpen] = useState(false);
  if (!trace || trace.length === 0) return null;

  return (
    <div className="mt-2 bg-surface/60 border border-border rounded-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-textdim font-mono uppercase tracking-wider"
      >
        <span className="flex items-center gap-1.5">
          <Wrench size={12} /> {trace.length} tool call{trace.length > 1 ? "s" : ""}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="px-3 pb-3 space-y-2">
          {trace.map((step, i) => {
            const meta = TOOL_META[step.tool] || { icon: Sparkles, label: step.tool };
            const Icon = meta.icon;
            return (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Icon size={13} className="text-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-textmain font-medium">{meta.label}</p>
                  <p className="text-textdim break-all">
                    {typeof step.input === "string" ? step.input : JSON.stringify(step.input)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
