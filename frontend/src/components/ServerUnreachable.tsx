export default function ServerUnreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-100 px-4 text-center">
      <p className="text-3xl font-bold text-indigo-600">pyChat</p>
      <p className="text-slate-600">Can't reach the server. Check your connection and try again.</p>
      <button onClick={onRetry} className="btn-primary">Retry</button>
    </div>
  );
}
