"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, Plus, RotateCcw, Trash2, Unlock } from "lucide-react";
import type { ClassificationValue, ContentClassification, SourceAnalysis } from "@/services/source-analysis/types";

const categories = [
  ["bodyRegions", "주요 부위"], ["symptoms", "증상"], ["movements", "움직임"],
  ["biomechanics", "생체역학"], ["exercises", "운동 유형"], ["audiences", "대상"],
  ["purposes", "콘텐츠 유형"], ["difficulty", "난이도"], ["searchIntentsKr", "Naver 검색 의도"],
  ["searchIntentsEn", "English Search Intent"], ["topicClusters", "Topic Cluster"],
] as const;

export function SourceAnalysisReview({ analysis, onChange, onRerun, compact = false }: {
  analysis: SourceAnalysis;
  onChange: (classification: ContentClassification) => void;
  onRerun?: () => void;
  compact?: boolean;
}) {
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const qualityTone = analysis.quality === "HIGH" ? "bg-[#e4f5ef] text-[#176b63]" : analysis.quality === "MEDIUM" ? "bg-[#fff3d7] text-[#8b6018]" : "bg-[#fff0ed] text-[#a3483e]";
  const evidenceSummary = useMemo(() => [
    ["Metadata", analysis.availability.metadata], ["Transcript", analysis.availability.transcript],
    ["Visual Frames", analysis.availability.frames], ["Caption", analysis.availability.caption],
  ], [analysis]);

  function updateCategory(key: (typeof categories)[number][0], next: ClassificationValue[]) {
    onChange({ ...analysis.classification, [key]: next });
  }
  function patchItem(key: (typeof categories)[number][0], id: string, patch: Partial<ClassificationValue>) {
    updateCategory(key, analysis.classification[key].map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  function addItem(key: (typeof categories)[number][0]) {
    const value = newValues[key]?.trim(); if (!value) return;
    updateCategory(key, [...analysis.classification[key], { id: crypto.randomUUID(), value, confidence: 100, state: "USER_MODIFIED", evidenceIds: [], primary: analysis.classification[key].length === 0, locked: false }]);
    setNewValues((current) => ({ ...current, [key]: "" }));
  }
  function move(key: (typeof categories)[number][0], index: number, delta: number) {
    const target = index + delta; if (target < 0 || target >= analysis.classification[key].length) return;
    const next = [...analysis.classification[key]]; [next[index], next[target]] = [next[target], next[index]];
    updateCategory(key, next.map((item, itemIndex) => ({ ...item, primary: itemIndex === 0 })));
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#dbe6e3] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><span className="eyebrow">SOURCE ANALYSIS</span><h3 className="mb-1 mt-2 text-lg font-extrabold">{analysis.metadata.title}</h3><p className="m-0 text-xs text-[#6c7c79]">{analysis.metadata.creatorName} · {analysis.sourcePlatform.replaceAll("_", " ")}</p></div>
        <div className={`rounded-xl px-4 py-2 text-center ${qualityTone}`}><strong className="block text-sm">{analysis.quality}</strong><span className="text-[0.65rem] font-bold">Evidence {analysis.evidenceLevel} · {analysis.confidence}%</span></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{evidenceSummary.map(([label, status]) => <div className="rounded-xl bg-[#f4f8f6] px-3 py-2" key={label}><span className="block text-[0.62rem] font-extrabold uppercase text-[#81908d]">{label}</span><strong className="text-xs">{String(status).replaceAll("_", " ")}</strong></div>)}</div>
      <p className="mb-0 mt-3 rounded-xl bg-[#f8faf9] p-3 text-xs leading-5 text-[#61716e]">{analysis.userMessage}</p>
      {analysis.evidenceLevel >= "D" ? <p className="mb-0 mt-2 text-xs font-bold text-[#9a5c31]">근거가 제한적이므로 전문가 발언이나 영상 장면을 단정하지 않습니다. 자막·영상 파일을 추가하면 분석을 업그레이드할 수 있습니다.</p> : null}
      {onRerun ? <button type="button" className="btn-secondary mt-3" onClick={onRerun}><RotateCcw size={14} /> AI 분류 다시 하기</button> : null}
    </section>

    <section className="rounded-2xl border border-[#dbe6e3] bg-white p-5">
      <div className="mb-4"><span className="eyebrow">AI 분류 결과</span><h3 className="mb-0 mt-2 text-lg font-extrabold">수정하고 잠글 수 있는 분류</h3></div>
      <div className={compact ? "space-y-4" : "grid gap-5 lg:grid-cols-2"}>{categories.map(([key, label]) => {
        const values = analysis.classification[key];
        return <div key={key}>
          <div className="mb-2 flex items-center justify-between"><span className="field-label !mb-0">{label}</span><span className="text-[0.62rem] text-[#8a9795]">첫 항목 = Primary</span></div>
          <div className="space-y-2">{values.map((item, index) => <div className="flex items-center gap-1 rounded-xl border border-[#dce6e3] bg-[#f9fbfa] p-2" key={item.id}>
            <button type="button" className={`min-w-0 flex-1 text-left text-xs font-extrabold ${item.confidence < 55 ? "text-[#9b7771]" : "text-[#334944]"}`} onClick={() => patchItem(key, item.id, { state: item.state === "AI_SUGGESTED" ? "USER_CONFIRMED" : item.state })}>
              {index === 0 ? "★ " : ""}{item.value} <span className="font-normal text-[#86928f]">{item.confidence}% · {item.state.replaceAll("_", " ")}</span>{item.confidence < 55 ? " · 검토 권장" : ""}
            </button>
            {item.state === "USER_CONFIRMED" ? <Check size={13} className="text-[#21806f]" /> : null}
            <button type="button" aria-label="위로" className="icon-button !h-7 !w-7" disabled={index === 0} onClick={() => move(key, index, -1)}><ChevronUp size={12} /></button>
            <button type="button" aria-label="아래로" className="icon-button !h-7 !w-7" disabled={index === values.length - 1} onClick={() => move(key, index, 1)}><ChevronDown size={12} /></button>
            <button type="button" aria-label={item.locked ? "잠금 해제" : "잠금"} className="icon-button !h-7 !w-7" onClick={() => patchItem(key, item.id, { locked: !item.locked, state: !item.locked ? "LOCKED" : "USER_MODIFIED" })}>{item.locked ? <Lock size={12} /> : <Unlock size={12} />}</button>
            <button type="button" aria-label="삭제" className="icon-button !h-7 !w-7" disabled={item.locked} onClick={() => updateCategory(key, values.filter((candidate) => candidate.id !== item.id))}><Trash2 size={12} /></button>
          </div>)}</div>
          <div className="mt-2 flex gap-2"><input className="field-input !py-2" value={newValues[key] ?? ""} placeholder="직접 추가" onChange={(event) => setNewValues((current) => ({ ...current, [key]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addItem(key); } }} /><button type="button" className="icon-button shrink-0" onClick={() => addItem(key)}><Plus size={15} /></button></div>
        </div>;
      })}</div>
      <KeywordEditor classification={analysis.classification} onChange={onChange} />
    </section>
  </div>;
}

function KeywordEditor({ classification, onChange }: { classification: ContentClassification; onChange: (classification: ContentClassification) => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const rows = [
    ["Naver", classification.keywords.naver], ["Instagram KR", classification.keywords.instagramKr],
    ["Instagram EN", classification.keywords.instagramEn], ["English Blog", classification.keywords.englishBlog],
  ] as const;
  function update(platform: keyof ContentClassification["keywords"], group: "primary" | "secondary", values: ClassificationValue[]) {
    onChange({ ...classification, keywords: { ...classification.keywords, [platform]: { ...classification.keywords[platform], [group]: values } } });
  }
  return <div className="mt-5 border-t border-[#e1e9e7] pt-4"><span className="field-label">플랫폼별 검색어 · 직접 수정/잠금</span><div className="grid gap-3 md:grid-cols-2">{rows.map(([label, set], rowIndex) => {
    const platform = (["naver", "instagramKr", "instagramEn", "englishBlog"] as const)[rowIndex];
    const draftKey = `${platform}:secondary`;
    return <div className="rounded-xl bg-[#f4f8f6] p-3" key={label}><strong className="text-xs text-[#176b63]">{label}</strong>
      {(["primary", "secondary"] as const).map((group) => <div className="mt-2" key={group}><span className="text-[0.62rem] font-extrabold uppercase text-[#81908d]">{group}</span><div className="mt-1 flex flex-wrap gap-1">{set[group].map((item) => <span className="inline-flex items-center gap-1 rounded-lg border border-[#d2e0dc] bg-white px-2 py-1 text-[0.7rem] font-bold" key={item.id}>{item.value}<button type="button" aria-label="키워드 잠금" onClick={() => update(platform, group, set[group].map((candidate) => candidate.id === item.id ? { ...candidate, locked: !candidate.locked, state: !candidate.locked ? "LOCKED" : "USER_MODIFIED" } : candidate))}>{item.locked ? <Lock size={10} /> : <Unlock size={10} />}</button><button type="button" aria-label="키워드 삭제" disabled={item.locked} onClick={() => update(platform, group, set[group].filter((candidate) => candidate.id !== item.id))}><Trash2 size={10} /></button></span>)}</div></div>)}
      <div className="mt-2 flex gap-1"><input className="field-input !py-1.5 !text-xs" value={drafts[draftKey] ?? ""} placeholder="보조 키워드 추가" onChange={(event) => setDrafts((current) => ({ ...current, [draftKey]: event.target.value }))} /><button type="button" className="icon-button !h-8 !w-8" onClick={() => { const value = drafts[draftKey]?.trim(); if (!value) return; update(platform, "secondary", [...set.secondary, { id: crypto.randomUUID(), value, confidence: 100, state: "USER_MODIFIED", evidenceIds: [], primary: false, locked: false }]); setDrafts((current) => ({ ...current, [draftKey]: "" })); }}><Plus size={13} /></button></div>
    </div>;
  })}</div></div>;
}
