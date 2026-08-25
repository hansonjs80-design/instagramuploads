"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import type { KeywordResearchResult } from "@/lib/naver/keyword-research";

export function KeywordResearch() {
  const [topic, setTopic] = useState("");
  const [periodMonths, setPeriodMonths] = useState(12);
  const [result, setResult] = useState<KeywordResearchResult | null>(null);
  const [primary, setPrimary] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function research(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/keyword-research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, periodMonths }) });
      const payload = await response.json() as { result?: KeywordResearchResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "분석에 실패했습니다.");
      setResult(payload.result); setPrimary(payload.result.primaryKeyword);
      setSelected(new Set(payload.result.candidates.slice(0, 8).map((item) => item.keyword)));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "분석에 실패했습니다."); } finally { setBusy(false); }
  }

  function toggle(keyword: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(keyword)) next.delete(keyword); else next.add(keyword); return next; });
  }

  return <div className="space-y-5">
    <form className="panel grid gap-3 p-5 md:grid-cols-[1fr_150px_auto]" onSubmit={research}>
      <input className="field-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 엄지발가락 통증" required minLength={2} />
      <select className="field-select" value={periodMonths} onChange={(e) => setPeriodMonths(Number(e.target.value))}>{[1, 3, 6, 12, 24].map((month) => <option key={month} value={month}>최근 {month}개월</option>)}</select>
      <button className="btn-primary" disabled={busy}><Search size={15} />{busy ? "분석 중…" : "Keyword Research"}</button>
    </form>
    {error ? <div className="rounded-xl border border-[#efc8c2] bg-[#fff4f2] p-4 text-sm font-bold text-[#98463d]">{error}</div> : null}
    {result ? <>
      <section className="grid gap-3 md:grid-cols-3"><div className="panel p-5"><span className="eyebrow">Primary keyword</span><h2 className="mb-0 mt-2 text-xl font-extrabold">{primary}</h2></div><div className="panel p-5"><span className="eyebrow">Selected</span><strong className="mt-2 block text-3xl">{selected.size}</strong><span className="text-xs text-[#6c7d79]">직접 변경 가능</span></div><div className="panel p-5"><span className="eyebrow">Trend provider</span><strong className="mt-2 block text-sm">{result.provider}</strong><span className="text-xs text-[#6c7d79]">{result.periodMonths}개월 상대 관심도</span></div></section>
      <section className="panel overflow-hidden"><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Primary</th><th>Select</th><th>Keyword</th><th>Type</th><th>Search Intent</th><th>상대 Trend</th><th>Brand</th><th>Relevance</th><th>Score</th></tr></thead><tbody>{result.candidates.map((item) => <tr key={item.keyword}><td><input type="radio" name="primary" checked={primary === item.keyword} onChange={() => { setPrimary(item.keyword); setSelected((current) => new Set(current).add(item.keyword)); }} aria-label={`${item.keyword} 대표 키워드`} /></td><td><input type="checkbox" checked={selected.has(item.keyword)} onChange={() => toggle(item.keyword)} aria-label={`${item.keyword} 선택`} /></td><td className="font-extrabold">{item.keyword}</td><td><span className="tag">{item.type}</span></td><td className="text-xs">{item.intents.join(" + ")}</td><td><div className="min-w-28"><strong>{item.naverTrend}/15</strong>{item.trend ? <Sparkline values={item.trend.series.map((point) => point.ratio)} /> : <span className="ml-1 text-[0.65rem] text-[#8a9895]">중립값</span>}</div></td><td>{item.brandFit}/15</td><td>{item.contentRelevance}/20</td><td><strong>{item.score}/100</strong></td></tr>)}</tbody></table></div><p className="m-0 border-t border-[#e4ebe9] px-4 py-3 text-xs text-[#6b7c79]">{result.trendNotice}</p></section>
      <section className="panel p-6"><div className="mb-4 flex items-center gap-2"><Sparkles size={17} className="text-[#176b63]" /><h2 className="section-title">Naver Title Engine · 8 candidates</h2></div><ol className="grid gap-2 md:grid-cols-2">{result.titleCandidates.map((title) => <li className="rounded-xl bg-[#f4f8f6] p-3 text-sm font-bold" key={title}>{title}</li>)}</ol></section>
    </> : null}
  </div>;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - (value / max) * 24}`).join(" ");
  return <svg viewBox="0 0 100 30" className="mt-1 h-7 w-28" role="img" aria-label="네이버 상대 검색 관심도 추이"><polyline points={points} fill="none" stroke="#176b63" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}
