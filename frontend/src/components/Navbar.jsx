import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, Heart, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const linkClasses = (path) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      location.pathname === path
        ? "bg-primary text-white shadow-glow"
        : "text-textdim hover:text-textmain"
    }`;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 border-b border-border bg-base/80 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
          <Bot size={20} className="text-white" />
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">Shopling</span>
      </Link>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link to="/" className={linkClasses("/")}>
              Chat
            </Link>
            <Link to="/wishlist" className={linkClasses("/wishlist")}>
              <span className="flex items-center gap-1.5">
                <Heart size={14} /> Wishlist
              </span>
            </Link>
            <button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="ml-1 px-4 py-2 rounded-full text-sm font-medium text-textdim hover:text-warn transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} /> Logout
            </button>
            <div
              className="ml-1 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-xs font-semibold text-textmain"
              title={user.name}
            >
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={linkClasses("/login")}>
              Log in
            </Link>
            <Link to="/register" className={linkClasses("/register")}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
