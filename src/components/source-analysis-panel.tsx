"use client";

import { useState } from "react";
import { SourceAnalysisReview } from "@/components/source-analysis-review";
import { outputTypeLabels, outputTypes, type OutputType } from "@/lib/content/types";
import type { ContentClassification, SourceAnalysis } from "@/services/source-analysis/types";

const noOutputTypes: OutputType[] = [];

export function SourceAnalysisPanel({ initialAnalysis, contentId, initialOutputTypes = noOutputTypes }: { initialAnalysis: SourceAnalysis; contentId?: string; initialOutputTypes?: OutputType[] }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [dirty, setDirty] = useState(false);
  const [targets, setTargets] = useState<OutputType[]>(initialOutputTypes);
  const [message, setMessage] = useState("");
  async function save(classification: ContentClassification) {
    setAnalysis((current) => ({ ...current, classification })); setMessage("저장 중…");
    const response = await fetch(`/api/source-analysis/${analysis.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classification }) });
    const payload = await response.json() as { analysis?: SourceAnalysis; error?: string };
    if (payload.analysis) { setAnalysis(payload.analysis); setDirty(true); setMessage("분류 변경이 저장되었습니다. 적용할 결과물을 선택해 주세요."); }
    else setMessage(payload.error || "저장하지 못했습니다.");
  }
  async function rerun() {
    setMessage("공개 정보로 다시 분석 중…");
    const response = await fetch(`/api/source-analysis/${analysis.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const payload = await response.json() as { analysis?: SourceAnalysis; error?: string };
    if (payload.analysis) { setAnalysis(payload.analysis); setDirty(true); setMessage("잠근 값과 사용자 수정값을 보존해 재분석했습니다. 적용할 결과물을 선택해 주세요."); }
    else setMessage(payload.error || "재분석하지 못했습니다.");
  }
  async function applyChanges() {
    if (!contentId || !targets.length) return;
    setMessage("선택한 결과물에 변경된 분류를 반영하는 중…");
    const response = await fetch(`/api/contents/${contentId}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outputTypes: targets }) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) { setMessage(payload.error || "변경사항을 반영하지 못했습니다."); return; }
    setDirty(false); setMessage("선택한 결과물만 새 버전으로 갱신했습니다."); window.location.reload();
  }
  return <div>{message ? <p className="mb-3 rounded-xl bg-[#eff6f3] px-4 py-3 text-xs font-bold text-[#41615b]">{message}</p> : null}{dirty && contentId ? <section className="mb-4 rounded-2xl border border-[#efcf91] bg-[#fff9ea] p-4"><strong className="text-sm">분류 정보가 변경되었습니다.</strong><p className="mb-3 mt-1 text-xs text-[#75623d]">변경사항을 적용할 결과물만 선택하세요. 선택하지 않은 결과물과 버전은 유지됩니다.</p><div className="flex flex-wrap gap-2">{outputTypes.map((type) => <label className="tag cursor-pointer" key={type}><input type="checkbox" checked={targets.includes(type)} onChange={() => setTargets((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])} /> {outputTypeLabels[type]}</label>)}</div><button type="button" className="btn-primary mt-3" disabled={!targets.length} onClick={() => void applyChanges()}>변경사항을 콘텐츠에 반영</button></section> : null}<SourceAnalysisReview analysis={analysis} onChange={save} onRerun={rerun} /></div>;
}
