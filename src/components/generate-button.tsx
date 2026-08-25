"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { outputTypeLabels, outputTypes, type OutputType } from "@/lib/content/types";

const defaultOutputTypes: OutputType[] = ["NAVER_BLOG_KR", "INSTAGRAM_KR"];

export function GenerateButton({
  contentId,
  initialOutputTypes = defaultOutputTypes,
}: {
  contentId: string;
  initialOutputTypes?: OutputType[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OutputType[]>(initialOutputTypes);
  const [error, setError] = useState<{ message: string; actionUrl?: string } | null>(null);

  async function generate(outputSelection: OutputType[]) {
    if (!outputSelection.length) { setError({ message: "만들 콘텐츠를 하나 이상 선택해 주세요." }); return; }
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/contents/${contentId}/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputTypes: outputSelection }),
      });
      const payload = await response.json() as { error?: string; actionUrl?: string };
      if (!response.ok) {
        setError({ message: payload.error || "생성에 실패했습니다.", actionUrl: payload.actionUrl });
        return;
      }
      setOpen(false); router.refresh();
    } catch (caught) { setError({ message: caught instanceof Error ? caught.message : "생성에 실패했습니다." }); }
    finally { setBusy(false); }
  }

  function toggle(type: OutputType) {
    setSelected((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  return <div className="relative">
    <button type="button" className="btn-primary" disabled={busy} onClick={() => setOpen((value) => !value)}><Sparkles size={16} /> {busy ? "선택 콘텐츠 생성 중…" : "콘텐츠 만들기"}</button>
    {open ? <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-[#d7e3e0] bg-white p-4 shadow-xl">
      <strong className="text-sm">어떤 콘텐츠를 만들까요?</strong>
      <div className="mt-3 space-y-2">{outputTypes.map((type) => <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#f5f8f7] p-3 text-xs font-bold" key={type}><input type="checkbox" checked={selected.includes(type)} onChange={() => toggle(type)} />{outputTypeLabels[type]}</label>)}</div>
      <div className="mt-3 flex gap-2"><button type="button" className="btn-secondary flex-1" disabled={busy} onClick={() => void generate([...outputTypes])}>모두 만들기</button><button type="button" className="btn-primary flex-1" disabled={busy || !selected.length} onClick={() => void generate(selected)}>선택 생성</button></div>
    </div> : null}
    {error ? <div className="mt-2 max-w-sm rounded-xl border border-[#efc9c3] bg-[#fff4f2] p-3 text-xs font-bold text-[#a8453c]"><p className="m-0 leading-5">{error.message}</p>{error.actionUrl ? <a className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 text-[#8d3f37] underline" href={error.actionUrl} target="_blank" rel="noreferrer">OpenAI 결제 설정 열기</a> : null}</div> : null}
  </div>;
}
