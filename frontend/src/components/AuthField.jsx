import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Icon-prefixed input used across Login/Register. Handles its own
 * show/hide toggle when type="password" so callers don't repeat that logic.
 */
export default function AuthField({ icon: Icon, type = "text", ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textdim pointer-events-none"
        />
      )}
      <input
        type={resolvedType}
        className={`w-full bg-surface2/70 border border-border rounded-xl py-2.5 text-sm text-textmain placeholder:text-textdim/70 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 ${
          Icon ? "pl-10" : "pl-4"
        } ${isPassword ? "pr-11" : "pr-4"}`}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-textdim hover:text-textmain transition-colors"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
  );
}
