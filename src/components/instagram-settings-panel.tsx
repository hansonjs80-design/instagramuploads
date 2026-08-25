"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Link2, RefreshCw, Unplug } from "lucide-react";
import type { InstagramAccount, PublishMode } from "@/services/instagram/types";

type HealthPayload = { health?: { account: boolean; token: boolean; professionalAccount: boolean; publishingPermission: boolean; apiReachable: boolean; mediaStorage: boolean; ready: boolean; messages: string[] }; limit?: { usage: number; total: number | null; available: boolean } | null; error?: string };

export function InstagramSettingsPanel() {
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [mode, setMode] = useState<PublishMode>("MOCK");
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/instagram/account", { cache: "no-store" }).then((response) => response.json()).then((payload: { account: InstagramAccount | null; configuredMode: PublishMode }) => {
      if (active) { setAccount(payload.account); setMode(payload.configuredMode); }
    });
    return () => { active = false; };
  }, []);

  async function connectMock() { setBusy(true); setMessage(""); try { const response = await fetch("/api/instagram/account", { method: "POST" }); const payload = await response.json() as { account?: InstagramAccount; error?: string }; if (!response.ok) throw new Error(payload.error); setAccount(payload.account!); window.dispatchEvent(new Event("system-status-refresh")); } catch (error) { setMessage(error instanceof Error ? error.message : "연결 실패"); } finally { setBusy(false); } }
  async function disconnect() { setBusy(true); await fetch("/api/instagram/account", { method: "DELETE" }); setAccount(null); setHealth(null); window.dispatchEvent(new Event("system-status-refresh")); setBusy(false); }
  async function check() { setBusy(true); setMessage(""); try { const response = await fetch("/api/instagram/health", { method: "POST" }); const payload = await response.json() as HealthPayload; setHealth(payload); if (!response.ok) throw new Error(payload.error); } catch (error) { setMessage(error instanceof Error ? error.message : "검사 실패"); } finally { setBusy(false); } }

  return <section className="panel mb-5 p-6 md:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><span className="eyebrow">Official Meta API</span><h2 className="mt-1 text-xl font-extrabold">Instagram 연결</h2><p className="section-note">Business·Creator 계정만 공식 게시를 지원합니다. 현재 모드: <strong className={mode === "LIVE" ? "text-[#b44f45]" : "text-[#176b63]"}>{mode}</strong></p></div>
      {account ? <button type="button" className="btn-secondary" onClick={() => void disconnect()} disabled={busy}><Unplug size={15} /> 연결 해제</button> : mode === "MOCK" ? <button type="button" className="btn-primary" onClick={() => void connectMock()} disabled={busy}><Link2 size={15} /> Mock 계정 연결</button> : <a className="btn-primary" href="/api/instagram/oauth/start"><Link2 size={15} /> Instagram 계정 연결</a>}
    </div>
    {account ? <div className="mt-5 grid gap-3 rounded-2xl bg-[#f4f8f6] p-5 md:grid-cols-3">
      <Info label="Account" value={`@${account.username}`} /><Info label="Account type" value={account.accountType} /><Info label="Status" value={account.connectionStatus} />
      <Info label="Instagram user ID" value={account.instagramUserId} /><Info label="Permissions" value={account.scopes.join(", ")} /><Info label="Last connected" value={new Date(account.connectedAt).toLocaleString("ko-KR")} />
    </div> : <div className="mt-5 rounded-xl border border-[#e1e8e6] p-4 text-sm text-[#657572]">연결 안 됨 · Consumer/Personal 계정은 자동 게시할 수 없습니다.</div>}
    {account ? <button type="button" className="btn-secondary mt-4" onClick={() => void check()} disabled={busy}><RefreshCw size={15} className={busy ? "animate-spin" : ""} /> 연결 상태 확인</button> : null}
    {health?.health ? <div className={`mt-4 rounded-2xl border p-4 ${health.health.ready ? "border-[#b9dbd2] bg-[#eaf5f1]" : "border-[#ebcfca] bg-[#fff5f3]"}`}>
      <strong className="flex items-center gap-2 text-sm">{health.health.ready ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}{health.health.ready ? "READY TO PUBLISH" : "설정 확인 필요"}</strong>
      <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">{[["Account", health.health.account], ["Token", health.health.token], ["Professional", health.health.professionalAccount], ["Publishing Permission", health.health.publishingPermission], ["API", health.health.apiReachable], ["Media Hosting", health.health.mediaStorage]].map(([label, ok]) => <span key={String(label)}>{ok ? "✓" : "!"} {label}</span>)}</div>
      {health.limit ? <p className="mb-0 mt-3 text-xs font-bold">Publishing Limit · {health.limit.usage} / {health.limit.total ?? "API 제공 한도"}</p> : null}
      {health.health.messages.map((item) => <p className="mb-0 mt-2 text-xs" key={item}>{item}</p>)}
    </div> : null}
    {message ? <p className="rounded-lg bg-[#fff5f3] p-3 text-xs font-bold text-[#9c443b]">{message}</p> : null}
    <details className="mt-5 rounded-xl border border-[#dce6e3] p-4"><summary className="cursor-pointer text-sm font-extrabold">Instagram Setup Guide</summary><div className="mt-3 space-y-2 text-xs leading-6 text-[#5e706c]"><p>1. Meta App에서 Instagram API with Instagram Login을 설정하고 Redirect URI를 정확히 등록합니다.</p><p>2. 최소 권한은 instagram_business_basic, instagram_business_content_publish입니다.</p><p>3. LIVE 모드는 외부 HTTPS APP_BASE_URL과 Meta가 접근 가능한 MEDIA_STORAGE_PUBLIC_BASE_URL이 필요합니다. localhost나 file:// 경로는 사용할 수 없습니다.</p><p>4. 로컬 서버를 끄면 진행 중 작업도 멈춥니다. 다시 켜면 DB 상태에서 이어서 확인할 수 있습니다.</p></div></details>
  </section>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><span className="field-label">{label}</span><strong className="block break-all text-sm">{value || "-"}</strong></div>; }
