"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Database, Sparkles } from "lucide-react";
import { contentTemplates } from "@/lib/content/templates";
import type { TagCategory, TemplateKey } from "@/lib/content/types";

const tagFields: Array<{ category: TagCategory; label: string; placeholder: string }> = [
  { category: "topic", label: "주제 태그", placeholder: "보행, 러닝" },
  { category: "body_part", label: "신체 부위", placeholder: "foot, ankle, hip" },
  { category: "exercise", label: "운동", placeholder: "calf raise, split squat" },
  { category: "symptom", label: "증상", placeholder: "발목 통증, 뻣뻣함" },
  { category: "biomechanics", label: "생체역학 개념", placeholder: "pronation, supination" },
];

function tagsFromFields(fields: Record<TagCategory, string>) {
  return tagFields.flatMap(({ category }) =>
    fields[category]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, category })),
  );
}

export function NewContentForm() {
  const router = useRouter();
  const [intent, setIntent] = useState<"save" | "generate">("generate");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("carousel_story");
  const [outputMode, setOutputMode] = useState<"instagram" | "naver_blog" | "both">("both");
  const [tagValues, setTagValues] = useState<Record<TagCategory, string>>({
    topic: "",
    body_part: "",
    exercise: "",
    symptom: "",
    biomechanics: "",
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const youtubeUrl = String(data.get("youtubeUrl") ?? "").trim();
    const instagramUrl = String(data.get("instagramUrl") ?? "").trim();
    if ((youtubeUrl && instagramUrl) || (!youtubeUrl && !instagramUrl)) {
      setError("YouTube URL과 Instagram URL 중 하나만 입력해 주세요.");
      setBusy(false);
      return;
    }

    try {
      setPhase("출처와 원문을 안전하게 저장하는 중…");
      const saveResponse = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertName: data.get("expertName"),
          originalTitle: data.get("originalTitle"),
          originalScript: data.get("originalScript"),
          sourceUrl: youtubeUrl || instagramUrl,
          templateKey,
          outputMode,
          experienceNote: data.get("experienceNote"),
          tags: tagsFromFields(tagValues),
        }),
      });
      const saved = (await saveResponse.json()) as { content?: { id: string }; error?: string };
      if (!saveResponse.ok || !saved.content) throw new Error(saved.error || "저장에 실패했습니다.");

      if (intent === "generate") {
        setPhase("브랜드 톤으로 분석·후크·카드뉴스·블로그를 생성하는 중…");
        const generationResponse = await fetch(`/api/contents/${saved.content.id}/generate`, {
          method: "POST",
        });
        const generated = (await generationResponse.json()) as { error?: string };
        if (!generationResponse.ok) {
          throw new Error(`${generated.error || "AI 생성에 실패했습니다."} 자료는 저장되었습니다.`);
        }
      }

      router.push(`/library/${saved.content.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "요청을 처리하지 못했습니다.");
      setBusy(false);
      setPhase("");
    }
  }

  const selectedTemplate = contentTemplates.find((template) => template.key === templateKey)!;

  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,.65fr)]">
      <section className="panel p-6 md:p-7">
        <div className="mb-6">
          <h2 className="section-title">원본과 출처</h2>
          <p className="section-note mt-1">자동 수집 대신 사용자가 확인한 스크립트를 직접 붙여 넣는 안전한 MVP 흐름입니다.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="field-label">YouTube URL</span>
            <input className="field-input" name="youtubeUrl" type="url" placeholder="https://youtube.com/watch?v=…" />
          </label>
          <label>
            <span className="field-label">Instagram URL</span>
            <input className="field-input" name="instagramUrl" type="url" placeholder="https://instagram.com/p/…" />
          </label>
          <label>
            <span className="field-label">전문가 이름 *</span>
            <input className="field-input" name="expertName" required placeholder="예: Dr. Jane Smith" />
          </label>
          <label>
            <span className="field-label">원본 제목 *</span>
            <input className="field-input" name="originalTitle" required placeholder="원본 콘텐츠 제목" />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="field-label">스크립트 또는 자막 *</span>
          <textarea className="field-textarea" name="originalScript" required minLength={40} placeholder="확인한 스크립트나 자막을 여기에 붙여 넣으세요. 원문은 출처 기록과 분석에만 사용됩니다." />
        </label>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="field-label">생성 플랫폼</span>
            <select className="field-select" value={outputMode} onChange={(event) => setOutputMode(event.target.value as typeof outputMode)}>
              <option value="instagram">Instagram</option>
              <option value="naver_blog">Naver Blog</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label>
            <span className="field-label">내 경험 / 관찰 추가</span>
            <textarea className="field-textarea !min-h-24" name="experienceNote" placeholder="직접 관찰한 내용만 입력하세요. 비어 있으면 AI가 임상 경험을 만들어내지 않습니다." />
          </label>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="panel p-6">
          <h2 className="section-title">콘텐츠 구조</h2>
          <label className="mt-4 block">
            <span className="field-label">Template Library</span>
            <select className="field-select" value={templateKey} onChange={(event) => setTemplateKey(event.target.value as TemplateKey)}>
              {contentTemplates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}
            </select>
          </label>
          <div className="mt-3 rounded-xl bg-[#eff5f2] p-3">
            <p className="m-0 text-xs font-bold text-[#38534f]">{selectedTemplate.description}</p>
            <p className="mb-0 mt-2 text-[0.7rem] leading-5 text-[#71817f]">{selectedTemplate.flow.join(" → ")}</p>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="section-title">검색 분류</h2>
          <p className="section-note mt-1">쉼표로 여러 항목을 구분하세요.</p>
          <div className="mt-4 space-y-3">
            {tagFields.map((field) => (
              <label key={field.category} className="block">
                <span className="field-label">{field.label}</span>
                <input
                  className="field-input"
                  value={tagValues[field.category]}
                  placeholder={field.placeholder}
                  onChange={(event) => setTagValues((current) => ({ ...current, [field.category]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        </section>
      </aside>

      <div className="xl:col-span-2">
        {error ? <div className="mb-4 rounded-xl border border-[#efc7c2] bg-[#fff4f2] px-4 py-3 text-sm font-semibold text-[#9c4037]">{error}</div> : null}
        {busy ? <div className="mb-4 rounded-xl border border-[#cfe1dc] bg-white px-4 py-3 text-sm font-semibold text-[#39645f]">{phase}</div> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <button type="submit" className="btn-secondary" disabled={busy} onClick={() => setIntent("save")}>
            <Database size={16} /> 자료만 저장
          </button>
          <button type="submit" className="btn-primary" disabled={busy} onClick={() => setIntent("generate")}>
            <Sparkles size={16} /> 저장하고 브랜드 콘텐츠 생성 <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
