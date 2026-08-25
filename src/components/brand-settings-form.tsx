/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { ImagePlus, Save, ShieldCheck } from "lucide-react";
import type { BrandProfile, HashtagGroups, TemplateKey } from "@/lib/content/types";
import { contentTemplates } from "@/lib/content/templates";
import { splitCommaList } from "@/lib/format";

const fontOptions = [
  "Pretendard, SUIT, Noto Sans KR, sans-serif",
  "SUIT, Pretendard, Noto Sans KR, sans-serif",
  "Noto Sans KR, Pretendard, sans-serif",
  "Apple SD Gothic Neo, Pretendard, sans-serif",
];

function hashtagText(groups: HashtagGroups, key: keyof HashtagGroups) {
  return (groups[key] ?? []).join(" ");
}

export function BrandSettingsForm({ initialProfile }: { initialProfile: BrandProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update<K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateHashtags(key: keyof HashtagGroups, value: string) {
    const tags = value.split(/[\s,]+/).map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.startsWith("#") ? tag : `#${tag}`);
    update("hashtagGroups", { ...profile.hashtagGroups, [key]: tags });
  }

  async function readLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) {
      setMessage("로고는 5MB 이하 이미지 파일만 사용할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logoDataUrl", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/brand-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const payload = (await response.json()) as { profile?: BrandProfile; error?: string };
      if (!response.ok || !payload.profile) throw new Error(payload.error || "저장에 실패했습니다.");
      setProfile(payload.profile);
      setMessage("브랜드 프로필을 저장했습니다. 다음 생성부터 이 설정이 적용됩니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="panel p-6 md:p-7">
        <h2 className="section-title">Instagram Engine</h2>
        <p className="section-note">후크, 카드 밀도, 안전 여백과 브랜드 요소의 기본 동작입니다.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Default card min"><input className="field-input" type="number" min="5" max="9" value={profile.instagramSettings.defaultCardMin} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, defaultCardMin: Number(e.target.value) })} /></Field>
          <Field label="Default card max"><input className="field-input" type="number" min="5" max="9" value={profile.instagramSettings.defaultCardMax} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, defaultCardMax: Number(e.target.value) })} /></Field>
          <Field label="Safe margin"><input className="field-input" type="number" min="48" max="140" value={profile.instagramSettings.safeMargin} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, safeMargin: Number(e.target.value) })} /></Field>
          <Field label="Hook preference"><input className="field-input" value={profile.instagramSettings.hookStylePreference} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, hookStylePreference: e.target.value })} /></Field>
          <Field label="Body character"><select className="field-select" value={profile.instagramSettings.bodyCharacterMode} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, bodyCharacterMode: e.target.value as BrandProfile["instagramSettings"]["bodyCharacterMode"] })}><option>OFF</option><option>LOW</option><option>MEDIUM</option></select></Field>
          <Field label="Text density"><select className="field-select" value={profile.instagramSettings.textDensity} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, textDensity: e.target.value as BrandProfile["instagramSettings"]["textDensity"] })}><option>LOW</option><option>BALANCED</option><option>DETAILED</option></select></Field>
          <Field label="CTA preference"><input className="field-input" value={profile.instagramSettings.ctaPreference} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, ctaPreference: e.target.value })} /></Field>
          <Field label="Cover style"><input className="field-input" value={profile.instagramSettings.coverStyle} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, coverStyle: e.target.value })} /></Field>
          <Field label="Image style"><input className="field-input" value={profile.instagramSettings.imageStyle} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, imageStyle: e.target.value })} /></Field>
          <Field label="Source display"><select className="field-select" value={profile.instagramSettings.sourceDisplay} onChange={(e) => update("instagramSettings", { ...profile.instagramSettings, sourceDisplay: e.target.value as BrandProfile["instagramSettings"]["sourceDisplay"] })}><option>LAST_CARD</option><option>CAPTION</option><option>BOTH</option></select></Field>
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e3f1ed] text-[#176b63]"><ShieldCheck size={19} /></span>
          <div><h2 className="section-title">Brand Identity</h2><p className="section-note mt-0.5">생성 언어와 독자 수준을 결정합니다.</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Brand name"><input className="field-input" value={profile.brandName} onChange={(e) => update("brandName", e.target.value)} /></Field>
          <Field label="Tagline"><input className="field-input" value={profile.tagline} onChange={(e) => update("tagline", e.target.value)} /></Field>
          <Field label="Audience"><textarea className="field-textarea !min-h-28" value={profile.audience} onChange={(e) => update("audience", e.target.value)} /></Field>
          <Field label="Tone of voice"><textarea className="field-textarea !min-h-28" value={profile.toneOfVoice} onChange={(e) => update("toneOfVoice", e.target.value)} /></Field>
          <Field label={`Humor level · ${profile.humorLevel}/5`}><input className="w-full accent-[#203A5B]" type="range" min="0" max="5" step="0.5" value={profile.humorLevel} onChange={(e) => update("humorLevel", Number(e.target.value))} /></Field>
          <Field label="Expertise level"><input className="field-input" value={profile.expertiseLevel} onChange={(e) => update("expertiseLevel", e.target.value)} /></Field>
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <h2 className="section-title">Visual System</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key) => (
            <Field key={key} label={key.replace("Color", " color")}>
              <div className="flex gap-2"><input type="color" className="h-11 w-14 rounded-lg border border-[#d4dfdc] bg-white p-1" value={profile[key]} onChange={(e) => update(key, e.target.value)} /><input className="field-input" value={profile[key]} onChange={(e) => update(key, e.target.value)} /></div>
            </Field>
          ))}
          <Field label="Font family"><select className="field-select" value={profile.fontFamily} onChange={(e) => update("fontFamily", e.target.value)}>{fontOptions.map((font) => <option key={font}>{font.split(",")[0]}</option>)}</select></Field>
          <Field label="Card template"><select className="field-select" value={profile.cardTemplate} onChange={(e) => update("cardTemplate", e.target.value as TemplateKey)}>{contentTemplates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}</select></Field>
          <Field label="Blog template"><input className="field-input" value={profile.blogTemplate} onChange={(e) => update("blogTemplate", e.target.value)} /></Field>
        </div>
        <Field label="Visual style"><textarea className="field-textarea mt-1 !min-h-24" value={profile.visualStyle} onChange={(e) => update("visualStyle", e.target.value)} /></Field>
        <Field label="Image style rules · 쉼표로 구분"><textarea className="field-textarea mt-1 !min-h-24" value={profile.imageStyleRules.join(", ")} onChange={(e) => update("imageStyleRules", splitCommaList(e.target.value))} /></Field>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Logo / watermark">
            <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#bfcfcb] bg-[#f8fbfa] text-sm font-bold text-[#58716d]">
              {profile.logoDataUrl ? <img src={profile.logoDataUrl} alt="브랜드 로고" className="max-h-16 max-w-40 object-contain" /> : <><ImagePlus size={18} /> 로고 이미지 선택</>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void readLogo(e.target.files?.[0])} />
            </label>
          </Field>
          <Field label="Watermark"><label className="flex h-11 items-center gap-3 rounded-xl border border-[#d4dfdc] px-3"><input type="checkbox" checked={profile.watermarkEnabled} onChange={(e) => update("watermarkEnabled", e.target.checked)} /><span className="text-sm font-semibold">카드에 반투명 워터마크 사용</span></label></Field>
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <h2 className="section-title">Signature & Citation</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Signature CTA"><input className="field-input" value={profile.signatureCta} onChange={(e) => update("signatureCta", e.target.value)} /></Field>
          <Field label="CTA style"><input className="field-input" value={profile.ctaStyle} onChange={(e) => update("ctaStyle", e.target.value)} /></Field>
          <Field label="Source citation format"><textarea className="field-textarea !min-h-24" value={profile.sourceCitationStyle} onChange={(e) => update("sourceCitationStyle", e.target.value)} /></Field>
          <Field label="Recurring phrases · 쉼표로 구분"><textarea className="field-textarea !min-h-24" value={profile.recurringPhrases.join(", ")} onChange={(e) => update("recurringPhrases", splitCommaList(e.target.value))} /></Field>
          <Field label="Recurring content blocks · 쉼표로 구분"><textarea className="field-textarea !min-h-24" value={profile.recurringContentBlocks.join(", ")} onChange={(e) => update("recurringContentBlocks", splitCommaList(e.target.value))} /></Field>
          <Field label="Category badge colors · 이름:#색상"><textarea className="field-textarea !min-h-24" value={Object.entries(profile.categoryBadgeColors).map(([name, color]) => `${name}:${color}`).join("\n")} onChange={(e) => update("categoryBadgeColors", Object.fromEntries(e.target.value.split("\n").map((line) => { const split = line.lastIndexOf(":"); return split > 0 ? [line.slice(0, split).trim(), line.slice(split + 1).trim()] : ["", ""]; }).filter(([name, color]) => name && /^#[0-9a-f]{6}$/i.test(color))))} /></Field>
        </div>
      </section>

      <section className="panel p-6 md:p-7">
        <h2 className="section-title">Hashtag Groups</h2>
        <p className="section-note mt-1">브랜드 태그는 모든 콘텐츠 추천에 고정 포함됩니다.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(["brand", "topic", "audience", "search"] as const).map((key) => <Field key={key} label={`${key} hashtags`}><textarea className="field-textarea !min-h-24" value={hashtagText(profile.hashtagGroups, key)} onChange={(e) => updateHashtags(key, e.target.value)} /></Field>)}
        </div>
      </section>

      {message ? <div className="rounded-xl border border-[#cbded9] bg-white px-4 py-3 text-sm font-bold text-[#345e59]">{message}</div> : null}
      <div className="flex justify-end"><button className="btn-primary" disabled={saving}><Save size={16} /> {saving ? "저장 중…" : "Brand Settings 저장"}</button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>;
}
