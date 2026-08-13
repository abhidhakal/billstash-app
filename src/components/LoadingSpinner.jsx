export default function LoadingSpinner({ size = 24, color }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-current border-t-transparent text-[var(--accent)]"
      style={{
        width: size,
        height: size,
        color: color || undefined,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
