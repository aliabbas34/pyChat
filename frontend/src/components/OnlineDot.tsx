export default function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"}`}
      title={online ? "Online" : "Offline"}
    />
  );
}
