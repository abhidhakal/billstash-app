import './SpendingRing.css';

export default function SpendingRing({
  amount = 0,
  size = 120,
  strokeWidth = 8,
  label = 'This Month',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // For visual purposes, cap at 100% (no target defined, just animate in)
  const progress = Math.min(amount > 0 ? 0.75 : 0, 1);
  const offset = circumference - progress * circumference;

  function formatAmount(val) {
    if (val >= 100000) {
      return `Rs. ${(val / 1000).toFixed(1)}k`;
    }
    return `Rs. ${val.toLocaleString('en-IN')}`;
  }

  return (
    <div className="spending-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          className="spending-ring-progress"
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
      <div className="spending-ring-content">
        <span className="spending-ring-amount">{formatAmount(amount)}</span>
        <span className="spending-ring-label">{label}</span>
      </div>
    </div>
  );
}
