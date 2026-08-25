"use client";

import { useState } from "react";
import { SourceAnalysisReview } from "@/components/source-analysis-review";
import type { ContentClassification, SourceAnalysis } from "@/services/source-analysis/types";

export function SourceAnalysisPanel({ initialAnalysis }: { initialAnalysis: SourceAnalysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [message, setMessage] = useState("");
  async function save(classification: ContentClassification) {
    setAnalysis((current) => ({ ...current, classification })); setMessage("저장 중…");
    const response = await fetch(`/api/source-analysis/${analysis.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classification }) });
    const payload = await response.json() as { analysis?: SourceAnalysis; error?: string };
    if (payload.analysis) { setAnalysis(payload.analysis); setMessage("분류 변경이 저장되었습니다."); }
    else setMessage(payload.error || "저장하지 못했습니다.");
  }
  async function rerun() {
    setMessage("공개 정보로 다시 분석 중…");
    const response = await fetch(`/api/source-analysis/${analysis.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const payload = await response.json() as { analysis?: SourceAnalysis; error?: string };
    if (payload.analysis) { setAnalysis(payload.analysis); setMessage("잠근 값과 사용자 수정값을 보존해 재분석했습니다."); }
    else setMessage(payload.error || "재분석하지 못했습니다.");
  }
  return <div>{message ? <p className="mb-3 rounded-xl bg-[#eff6f3] px-4 py-3 text-xs font-bold text-[#41615b]">{message}</p> : null}<SourceAnalysisReview analysis={analysis} onChange={save} onRerun={rerun} /></div>;
}
