export function Placeholder({ title }: { title: string }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">{title}</h1>
      </div>
    </div>
  );
}
