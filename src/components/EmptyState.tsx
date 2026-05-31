import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: "search" | "inbox" | "alert";
};

export function EmptyState({ title, subtitle, action, icon = "inbox" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
        style={{ background: "#f0f2f8", color: "#4f6bab" }}
        aria-hidden
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon === "search" && (
            <>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </>
          )}
          {icon === "inbox" && (
            <>
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5 5h14l3 7v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6l3-7z" />
            </>
          )}
          {icon === "alert" && (
            <>
              <path d="M12 3l10 18H2L12 3z" />
              <path d="M12 10v5M12 18v.5" />
            </>
          )}
        </svg>
      </div>
      <h3 className="text-[14px] font-medium" style={{ color: "#0f172a" }}>
        {title}
      </h3>
      {subtitle && (
        <p className="text-[12px] mt-1 max-w-sm" style={{ color: "#64748b" }}>
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
