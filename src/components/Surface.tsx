export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="text-[20px] font-medium tracking-tight" style={{ color: "#071040" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] mt-1" style={{ color: "#64748b" }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

export function Surface({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg p-5 ${className}`}
      style={{ background: "#ffffff", border: "1px solid #e2e5f0" }}
    >
      {title && (
        <h2 className="text-[14px] font-medium mb-4" style={{ color: "#0f172a" }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
