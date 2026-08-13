export default function SpendingRing({
  amount = 0,
  size = 120,
  strokeWidth = 8,
  label = 'This Month',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(amount > 0 ? 0.75 : 0, 1);
  const offset = circumference - progress * circumference;

  function formatAmount(val) {
    if (val >= 100000) {
      return `Rs. ${(val / 1000).toFixed(1)}k`;
    }
    return `Rs. ${val.toLocaleString('en-IN')}`;
  }

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="font-bold text-sm text-[var(--text-primary)] leading-tight">{formatAmount(amount)}</span>
        <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{label}</span>
      </div>
    </div>
  );
}
