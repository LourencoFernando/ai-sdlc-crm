export function Skeleton({ width = '100%', height = 16, radius }: { width?: number | string; height?: number | string; radius?: number }) {
  return <div className="skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius }} />;
}

/** Soft gray placeholders in the shape of a panel's content. */
export function PanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="panel" aria-busy="true" aria-label="Loading">
      <div style={{ display: 'grid', gap: 14 }}>
        <Skeleton width="30%" height={20} />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} height={14} width={`${90 - (i % 3) * 15}%`} />
        ))}
      </div>
    </div>
  );
}
