import { Bot } from "lucide-react";

/**
 * Shared frame for the Login and Register pages: ambient gradient glow,
 * centered glassmorphic card, and the Shopling logo lockup up top so both
 * auth screens feel like one continuous moment instead of two bare forms.
 */
export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-[calc(100vh-77px)] flex items-center justify-center px-6 py-12 overflow-hidden">
      {/* ambient glow blobs - purely decorative, sit behind everything */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/25 blur-[100px]" />
        <div
          className="animate-drift absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-secondary/20 blur-[110px]"
          style={{ animationDelay: "-7s" }}
        />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow mb-4">
            <Bot size={24} className="text-white" />
          </div>
          {eyebrow && (
            <span className="text-xs font-medium tracking-widest uppercase text-secondary mb-2">
              {eyebrow}
            </span>
          )}
          <h1 className="font-display font-semibold text-2xl md:text-[28px] text-center text-textmain">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-textdim text-center mt-2 max-w-xs">{subtitle}</p>
          )}
        </div>

        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6 md:p-8">
          {children}
        </div>

        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </div>
  );
}
