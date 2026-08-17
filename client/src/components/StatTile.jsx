export default function StatTile({ label, value, hint }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-label">{label}</span>
      <strong className="stat-tile-value">{value}</strong>
      {hint && <span className="stat-tile-hint">{hint}</span>}
    </div>
  );
}
