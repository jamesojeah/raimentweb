export default function ProductSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="aspect-square" style={{ background: "rgba(124,58,237,0.08)" }} />
      <div className="p-3.5 space-y-2">
        <div className="h-2.5 w-14 rounded-full" style={{ background: "rgba(167,139,250,0.1)" }} />
        <div className="h-3.5 w-3/4 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3.5 w-16 rounded-full" style={{ background: "rgba(124,58,237,0.14)" }} />
        <div className="h-9 w-full rounded-xl mt-1" style={{ background: "rgba(124,58,237,0.1)" }} />
      </div>
    </div>
  );
}
