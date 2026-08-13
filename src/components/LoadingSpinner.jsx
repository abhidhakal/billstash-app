import './LoadingSpinner.css';

export default function LoadingSpinner({ size = 24, color }) {
  return (
    <div
      className="loading-spinner"
      style={{
        width: size,
        height: size,
        borderColor: color || undefined,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
