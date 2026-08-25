"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Payload = { environment: "DEVELOPMENT" | "PRODUCTION"; items: Array<{ name: string; status: "READY" | "WARNING" | "ERROR"; message: string }> };
export function SystemStatus() {
  const [data, setData] = useState<Payload | null>(null); const [busy, setBusy] = useState(false);
  async function load() { setBusy(true); const response = await fetch("/api/system-status", { cache: "no-store" }); setData(await response.json() as Payload); setBusy(false); }
  useEffect(() => {
    let active = true;
    const refresh = () => { fetch("/api/system-status", { cache: "no-store" }).then((response) => response.json()).then((payload: Payload) => { if (active) setData(payload); }); };
    refresh();
    window.addEventListener("system-status-refresh", refresh);
    return () => { active = false; window.removeEventListener("system-status-refresh", refresh); };
  }, []);
  return <section className="panel mb-5 p-6 md:p-7"><div className="flex items-start justify-between gap-4"><div><span className="eyebrow">Deployment health</span><h2 className="mt-1 text-xl font-extrabold">System Status</h2><p className="section-note">{data?.environment ?? "확인 중"}</p></div><button className="btn-secondary" type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={15} className={busy ? "animate-spin" : ""} /> 새로 확인</button></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data?.items.map((item) => <div className="rounded-xl border border-[#dce6e3] p-4" key={item.name}><span className={`text-[.65rem] font-black tracking-wider ${item.status === "READY" ? "text-[#23806f]" : item.status === "WARNING" ? "text-[#9a6a22]" : "text-[#b44f45]"}`}>{item.status}</span><strong className="mt-1 block text-sm">{item.name}</strong><p className="mb-0 mt-2 text-xs leading-5 text-[#6a7a77]">{item.message}</p></div>)}</div></section>;
}
