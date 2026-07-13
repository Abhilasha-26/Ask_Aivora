import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Globe, AlertCircle, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "../components/AuthShell.jsx";
import AuthField from "../components/AuthField.jsx";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, country);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="AskAivora"
      title="Create your account"
      subtitle="Tell your agent a little about yourself so it can shop smarter for you."
      footer={
        <p className="text-sm text-textdim">
          Already have an account?{" "}
          <Link to="/login" className="text-secondary hover:underline font-medium">
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-textdim px-0.5">Name</label>
          <AuthField
            icon={User}
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-textdim px-0.5">Email</label>
          <AuthField
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-textdim px-0.5">Password</label>
          <AuthField
            icon={Lock}
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-textdim px-0.5">Country</label>
          <div className="relative">
            <Globe
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textdim pointer-events-none"
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full appearance-none bg-surface2/70 border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-textmain outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-textdim pointer-events-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-warn/10 border border-warn/25 text-warn text-sm rounded-xl px-3.5 py-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-[#8b7cf5] rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-glow transition-shadow flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating account...
            </>
          ) : (
            <>
              Sign up <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
