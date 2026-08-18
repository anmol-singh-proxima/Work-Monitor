export function SkeletonRows({ count = 3, className = '' }) {
  return (
    <div className={`skeleton-rows ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span className="skeleton skeleton-row" key={index} />
      ))}
    </div>
  );
}
