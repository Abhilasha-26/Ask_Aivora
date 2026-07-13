import { useEffect, useState } from "react";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import api from "../api.js";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/wishlist")
      .then(({ data }) => setItems(data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productName) => {
    await api.delete("/wishlist", { data: { productName } });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary shadow-glow flex items-center justify-center shrink-0">
          <Heart size={15} className="text-white" />
        </div>

        <h1 className="font-display font-semibold text-2xl">
          Your Wishlist
        </h1>
      </div>

      <p className="text-textdim text-sm mb-8 ml-10">
        Items you asked AskAivora to save. Say "add to my wishlist" in chat to
        add more.
      </p>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[60px] rounded-xl bg-surface border border-border animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Heart size={28} className="text-textdim mx-auto mb-3" />
          <p className="text-textmain text-sm font-medium">
            Your wishlist is empty
          </p>
          <p className="text-textdim text-xs mt-1">
            Tell AskAivora to save something once it finds a product you like.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 transition-colors hover:border-secondary/40"
          >
            <div className="min-w-0 pr-3">
              <p className="text-sm font-medium truncate">
                {item.productName}
              </p>

              {item.price != null && (
                <p className="text-xs text-textdim mt-0.5">
                  ₹{item.price}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textdim hover:text-secondary transition-colors"
                  title="Open product"
                >
                  <ExternalLink size={16} />
                </a>
              )}

              <button
                onClick={() => remove(item.productName)}
                className="text-textdim hover:text-warn transition-colors"
                title="Remove from wishlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}