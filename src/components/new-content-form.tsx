"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Database, Link2, Sparkles, Upload } from "lucide-react";
import { SourceAnalysisReview } from "@/components/source-analysis-review";
import { contentTemplates } from "@/lib/content/templates";
import {
  outputTypeLabels,
  outputTypes,
  type ContentTag,
  type OutputType,
  type TagCategory,
  type TemplateKey,
} from "@/lib/content/types";
import type { AnalysisMode, ContentClassification, SourceAnalysis } from "@/services/source-analysis/types";

export function NewContentForm() {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState("");
  const [expertName, setExpertName] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [script, setScript] = useState("");
  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [experienceNote, setExperienceNote] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("STANDARD");
  const [analysis, setAnalysis] = useState<SourceAnalysis | null>(null);
  const [templateKey, setTemplateKey] = useState<TemplateKey>("carousel_story");
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<OutputType[]>(["NAVER_BLOG_KR", "INSTAGRAM_KR"]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");

  async function runAnalysis(force = false): Promise<SourceAnalysis> {
    if (!sourceUrl.trim()) throw new Error("YouTube 또는 Instagram 콘텐츠 링크를 입력해 주세요.");
    setBusy(true); setError(""); setPhase("플랫폼과 공개 정보를 확인하고 자동 분류하는 중…");
    const form = new FormData();
    form.set("sourceUrl", sourceUrl); form.set("mode", analysisMode); form.set("force", String(force));
    if (expertName) form.set("expertName", expertName); if (script) form.set("script", script); if (caption) form.set("caption", caption);
    if (note) form.set("note", note); if (experienceNote) form.set("experienceNote", experienceNote); if (mediaFile) form.set("mediaFile", mediaFile);
    const response = await fetch("/api/source-analysis", { method: "POST", body: form });
    const payload = await response.json() as { analysis?: SourceAnalysis; error?: string };
    if (!response.ok || !payload.analysis) throw new Error(payload.error || "자동 분석에 실패했습니다.");
    setAnalysis(payload.analysis);
    if (!expertName) setExpertName(payload.analysis.metadata.creatorName === "확인 필요" ? "" : payload.analysis.metadata.creatorName);
    if (!originalTitle) setOriginalTitle(payload.analysis.metadata.title === "제목 확인 필요" ? "" : payload.analysis.metadata.title);
    setBusy(false); setPhase("");
    return payload.analysis;
  }

  async function saveClassification(next: ContentClassification) {
    if (!analysis) return;
    setAnalysis({ ...analysis, classification: next });
    const response = await fetch(`/api/source-analysis/${analysis.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classification: next }) });
    if (!response.ok) setError("분류 변경을 서버에 저장하지 못했습니다. 다시 시도해 주세요.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const action = submitter?.value || "selected";
      const requestedOutputs = action === "all" ? [...outputTypes] : selectedOutputTypes;
      if (action !== "save" && requestedOutputs.length === 0) throw new Error("만들 콘텐츠를 하나 이상 선택해 주세요.");
      const currentAnalysis = analysis ?? await runAnalysis(false);
      setPhase("출처·근거·분류를 콘텐츠 라이브러리에 저장하는 중…");
      const response = await fetch("/api/contents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        sourceUrl, expertName: expertName || currentAnalysis.metadata.creatorName, originalTitle: originalTitle || currentAnalysis.metadata.title,
        originalScript: script || caption || currentAnalysis.availableText, experienceNote, templateKey,
        selectedOutputTypes: requestedOutputs,
        sourceAnalysisId: currentAnalysis.id, tags: classificationTags(currentAnalysis.classification),
      }) });
      const saved = await response.json() as { content?: { id: string }; error?: string };
      if (!response.ok || !saved.content) throw new Error(saved.error || "저장에 실패했습니다.");
      if (action !== "save") {
        setPhase(`공통 Research를 공유해 선택한 콘텐츠 ${requestedOutputs.length}개를 생성하는 중…`);
        const generatedResponse = await fetch(`/api/contents/${saved.content.id}/generate`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outputTypes: requestedOutputs }),
        });
        const generated = await generatedResponse.json() as { error?: string };
        if (!generatedResponse.ok) throw new Error(`${generated.error || "AI 생성에 실패했습니다."} 자료와 분류는 저장되었습니다.`);
      }
      router.push(`/library/${saved.content.id}`); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "요청을 처리하지 못했습니다."); setBusy(false); setPhase(""); }
  }

  const selectedTemplate = contentTemplates.find((template) => template.key === templateKey)!;
  function toggleOutput(outputType: OutputType) {
    setSelectedOutputTypes((current) => current.includes(outputType)
      ? current.filter((item) => item !== outputType)
      : [...current, outputType]);
  }
  return <form onSubmit={submit} className="space-y-5">
    <section className="panel p-6 md:p-7">
      <div className="mb-5"><span className="eyebrow">URL FIRST</span><h2 className="mb-1 mt-2 text-xl font-extrabold">콘텐츠 링크</h2><p className="m-0 text-sm text-[#6b7b78]">링크만 넣어도 시작할 수 있어요. 자막이나 파일을 더하면 분석 정확도가 높아집니다.</p></div>
      <div className="flex flex-col gap-3 md:flex-row"><label className="min-w-0 flex-1"><span className="field-label">YouTube / Instagram URL</span><div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71817e]" size={17} /><input className="field-input !pl-10" type="url" value={sourceUrl} required placeholder="https://youtube.com/watch?v=… 또는 https://instagram.com/reel/…" onChange={(event) => { setSourceUrl(event.target.value); setAnalysis(null); }} /></div></label><label className="md:w-40"><span className="field-label">분석 모드</span><select className="field-select" value={analysisMode} onChange={(event) => setAnalysisMode(event.target.value as AnalysisMode)}><option value="FAST">FAST</option><option value="STANDARD">STANDARD</option><option value="DEEP">DEEP</option></select></label><button type="button" className="btn-primary self-end" disabled={busy} onClick={() => runAnalysis(false).catch((caught) => { setError(caught instanceof Error ? caught.message : "분석 실패"); setBusy(false); setPhase(""); })}><Sparkles size={16} /> 자동 분석</button></div>
      <details className="mt-5 rounded-2xl border border-[#dce6e3] bg-[#f9fbfa] p-4"><summary className="cursor-pointer text-sm font-extrabold">선택 입력 · 정확도 높이기</summary><div className="mt-4 grid gap-4 md:grid-cols-2"><label><span className="field-label">전문가 이름</span><input className="field-input" value={expertName} onChange={(event) => setExpertName(event.target.value)} placeholder="자동 확인되지 않을 때 입력" /></label><label><span className="field-label">원본 제목</span><input className="field-input" value={originalTitle} onChange={(event) => setOriginalTitle(event.target.value)} placeholder="자동 확인되지 않을 때 입력" /></label><label><span className="field-label">스크립트</span><textarea className="field-textarea" value={script} onChange={(event) => setScript(event.target.value)} placeholder="선택사항" /></label><label><span className="field-label">자막</span><textarea className="field-textarea" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="선택사항" /></label><label><span className="field-label">내 메모</span><textarea className="field-textarea !min-h-24" value={note} onChange={(event) => setNote(event.target.value)} placeholder="콘텐츠에서 확인한 내용" /></label><label><span className="field-label">내 경험 / 임상 관찰</span><textarea className="field-textarea !min-h-24" value={experienceNote} onChange={(event) => setExperienceNote(event.target.value)} placeholder="직접 관찰한 사실만 입력" /></label><label className="md:col-span-2"><span className="field-label">내가 보유한 영상 / 오디오 파일</span><span className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#b8cbc6] bg-white text-sm font-bold text-[#47625d]"><Upload size={16} />{mediaFile ? mediaFile.name : "파일 선택"}<input className="sr-only" type="file" accept="audio/*,video/*" onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} /></span></label></div></details>
    </section>

    {analysis ? <SourceAnalysisReview analysis={analysis} onChange={saveClassification} onRerun={() => runAnalysis(true).catch((caught) => { setError(caught instanceof Error ? caught.message : "재분석 실패"); setBusy(false); })} /> : null}

    <section className="panel p-6">
      <div className="mb-4"><span className="eyebrow">OUTPUT SELECTION</span><h2 className="mb-1 mt-2 text-xl font-extrabold">어떤 콘텐츠를 만들까요?</h2><p className="m-0 text-sm text-[#6b7b78]">공통 분석은 한 번만 수행하고 선택한 콘텐츠만 생성합니다.</p></div>
      <div className="grid gap-3 lg:grid-cols-3">{outputTypes.map((outputType) => {
        const checked = selectedOutputTypes.includes(outputType);
        return <label key={outputType} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${checked ? "border-[#3a8b7e] bg-[#e9f5f2] shadow-sm" : "border-[#dce6e3] bg-white hover:bg-[#f7faf9]"}`}>
          <input type="checkbox" className="size-4 accent-[#176b63]" checked={checked} onChange={() => toggleOutput(outputType)} />
          <span><strong className="block text-sm">{outputTypeLabels[outputType]}</strong><span className="mt-1 block text-xs text-[#71817e]">{outputType === "NAVER_BLOG_KR" ? "검색 의도·키워드·장문 구조" : outputType === "INSTAGRAM_KR" ? "한국어 후크·Swipe Flow·캡션" : "영어권용 독립 후크·카피·캡션"}</span></span>
        </label>;
      })}</div>
      <label className="mt-5 block"><span className="field-label">콘텐츠 구조</span><select className="field-select" value={templateKey} onChange={(event) => setTemplateKey(event.target.value as TemplateKey)}>{contentTemplates.map((template) => <option value={template.key} key={template.key}>{template.name}</option>)}</select><span className="mt-2 block text-xs text-[#74827f]">{selectedTemplate.description} · {selectedTemplate.flow.join(" → ")}</span></label>
    </section>

    {error ? <div className="rounded-xl border border-[#efc7c2] bg-[#fff4f2] px-4 py-3 text-sm font-semibold text-[#9c4037]">{error}</div> : null}
    {busy ? <div className="rounded-xl border border-[#cfe1dc] bg-white px-4 py-3 text-sm font-semibold text-[#39645f]">{phase}</div> : null}
    <div className="flex flex-wrap justify-end gap-3"><button type="submit" name="action" value="save" className="btn-secondary" disabled={busy}><Database size={16} /> 자료만 저장</button><button type="submit" name="action" value="all" className="btn-secondary" disabled={busy}><Sparkles size={16} /> 모두 만들기</button><button type="submit" name="action" value="selected" className="btn-primary" disabled={busy || selectedOutputTypes.length === 0}><Sparkles size={16} /> 선택한 콘텐츠 만들기 <ArrowRight size={15} /></button></div>
  </form>;
}

function classificationTags(classification: ContentClassification): ContentTag[] {
  const rows: Array<[TagCategory, typeof classification.bodyRegions]> = [["body_part", classification.bodyRegions], ["symptom", classification.symptoms], ["exercise", classification.exercises], ["biomechanics", classification.biomechanics], ["topic", [...classification.movements, ...classification.topicClusters]]];
  const seen = new Set<string>();
  return rows.flatMap(([category, values]) => values.flatMap((item) => { const key = `${category}:${item.value}`; if (seen.has(key)) return []; seen.add(key); return [{ name: item.value, category }]; }));
}
