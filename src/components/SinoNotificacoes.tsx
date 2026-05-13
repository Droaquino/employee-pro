import { forwardRef, useEffect, useState } from "react";
import { COLORS } from "@/constants/colors";

type Props = {
  count: number;
  onClick: () => void;
};

export const SinoNotificacoes = forwardRef<HTMLButtonElement, Props>(function SinoNotificacoes({ count, onClick }, ref) {
  const [shake, setShake] = useState(false);
  const [prev, setPrev] = useState(count);

  useEffect(() => {
    if (count > prev) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
    setPrev(count);
  }, [count, prev]);

  const display = count > 99 ? "99+" : String(count);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={`Notificações${count > 0 ? `, ${count} não lidas` : ""}`}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] relative"
      style={{ color: count > 0 ? "#e8ecff" : "#8fa3cc", background: "transparent" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#0d1a5e"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span className="relative inline-flex" style={{ animation: shake ? "arbrent-shake 0.5s ease" : undefined }}>
        <BellIcon hasDot={count > 0} />
        {count > 0 && (
          <span
            className="absolute flex items-center justify-center font-bold text-white"
            style={{
              top: -6,
              right: -8,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 9,
              background: COLORS.risco,
              fontSize: 10,
              lineHeight: 1,
              border: "2px solid #071040",
            }}
          >
            {display}
          </span>
        )}
      </span>
      <span className="flex-1 text-left">Notificações</span>
    </button>
  );
});

function BellIcon({ hasDot }: { hasDot: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      {hasDot && <circle cx="18" cy="6" r="2.5" fill={COLORS.risco} stroke="none" />}
    </svg>
  );
}
