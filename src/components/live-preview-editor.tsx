/* eslint-disable @next/next/no-img-element */
"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Download,
  ImagePlus,
  History,
  Lock,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react";
import { defaultCardBackgrounds, normalizeCards } from "@/lib/content/card-editor";
import type {
  BrandProfile,
  ContentAngle,
  CreativeBrief,
  InstagramCard,
  InstagramCardStyle,
  InstagramEnginePlan,
} from "@/lib/content/types";
import { getTextDensity, improveUnlockedCards, scoreInstagram } from "@/lib/instagram/quality-engine";
import type { InstagramAccount } from "@/services/instagram/types";

type SaveState = "saved" | "saving" | "error";

function darkBackground(color: string): boolean {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return true;
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return red * 0.299 + green * 0.587 + blue * 0.114 < 145;
}

function positionStyle(position: InstagramCardStyle["imagePosition"]): React.CSSProperties {
  const common: React.CSSProperties = { position: "absolute", objectFit: "contain", zIndex: 1 };
  if (position === "top") return { ...common, left: "50%", top: "8%", transform: "translateX(-50%)" };
  if (position === "bottom") return { ...common, left: "50%", bottom: "11%", transform: "translateX(-50%)" };
  if (position === "left") return { ...common, left: "3%", top: "50%", transform: "translateY(-50%)" };
  if (position === "right") return { ...common, right: "3%", top: "50%", transform: "translateY(-50%)" };
  return { ...common, left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
}

const CardArtwork = forwardRef<
  HTMLDivElement,
  { card: InstagramCard; total: number; brand: BrandProfile; exportMode?: boolean }
>(function CardArtwork({ card, total, brand, exportMode = false }, ref) {
  const style = card.style!;
  const isDark = darkBackground(style.background);
  const textColor = isDark ? "#ffffff" : "#1f2933";
  const secondaryText = isDark ? "rgba(255,255,255,.78)" : "#5b6573";
  const badgeColor = brand.categoryBadgeColors[card.categoryBadge || ""] || brand.secondaryColor;
  const vertical = style.textPosition === "top" ? "flex-start" : style.textPosition === "bottom" ? "flex-end" : "center";
  const logoPlacement: Record<string, React.CSSProperties> = {
    "top-left": { top: "4.5%", left: "6.5%" },
    "top-right": { top: "4.5%", right: "6.5%" },
    "bottom-left": { bottom: "4.5%", left: "6.5%" },
    "bottom-right": { bottom: "4.5%", right: "6.5%" },
  };

  return (
    <div
      ref={ref}
      className="relative isolate overflow-hidden"
      style={{
        width: exportMode ? 1080 : "100%",
        height: exportMode ? 1350 : "auto",
        aspectRatio: "4 / 5",
        containerType: "inline-size",
        background: style.background,
        color: textColor,
        fontFamily: brand.fontFamily,
      }}
    >
      {style.imageDataUrl ? (
        <>
          <img
            src={style.imageDataUrl}
            alt=""
            style={{ ...positionStyle(style.imagePosition), width: `${style.imageSize}%`, maxHeight: "70%" }}
          />
          <div className="absolute inset-0 z-[2]" style={{ background: isDark ? "linear-gradient(180deg, rgba(9,24,31,.16), rgba(9,24,31,.5))" : "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.64))" }} />
        </>
      ) : null}

      {brand.watermarkEnabled && brand.logoDataUrl ? <img src={brand.logoDataUrl} alt="" className="absolute left-1/2 top-1/2 z-[2] w-[42%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.06]" /> : null}

      <div className="absolute inset-x-[6.6%] top-[5.2%] z-10 flex items-start justify-between gap-4">
        {style.badgeStyle !== "hidden" ? (
          <span
            style={{
              background: style.badgeStyle === "outline" ? "transparent" : badgeColor,
              border: `2px solid ${badgeColor}`,
              borderRadius: style.badgeStyle === "pill" ? "999px" : "7px",
              color: darkBackground(badgeColor) && style.badgeStyle !== "outline" ? "white" : textColor,
              fontSize: "2.15cqw",
              padding: "1.1cqw 2.1cqw",
              fontWeight: 800,
              letterSpacing: ".08em",
            }}
          >
            {(card.categoryBadge || "MOVEMENT").toUpperCase()}
          </span>
        ) : <span />}
        <span style={{ fontSize: "2.35cqw", fontWeight: 800, letterSpacing: ".06em" }}>{card.slide}/{total}</span>
      </div>

      <div
        className="absolute inset-x-0 top-0 z-[5] flex h-full flex-col"
        style={{ justifyContent: vertical, padding: `${style.spacing / 10.8}cqw` }}
      >
        <div style={{ textAlign: style.textAlign }}>
          <h2
            style={{
              margin: 0,
              fontSize: `${style.headlineSize / 10.8}cqw`,
              lineHeight: 1.12,
              fontWeight: style.fontWeight,
              letterSpacing: "-.045em",
              whiteSpace: "pre-wrap",
              textWrap: "balance",
            }}
          >
            {card.headline}
          </h2>
          {card.subheadline ? <p style={{ margin: "1.5cqw 0 0", fontSize: `${Math.max(18, style.bodySize - 4) / 10.8}cqw`, fontWeight: 700, color: secondaryText, whiteSpace: "pre-wrap" }}>{card.subheadline}</p> : null}
          <p
            style={{
              margin: "3.2cqw 0 0",
              fontSize: `${style.bodySize / 10.8}cqw`,
              lineHeight: style.lineHeight,
              fontWeight: Math.max(400, style.fontWeight - 200),
              color: secondaryText,
              whiteSpace: "pre-wrap",
            }}
          >
            {card.body}
          </p>
          {card.callout ? <p style={{ margin: "2.2cqw 0 0", color: brand.accentColor, fontSize: "2.25cqw", fontWeight: 800, whiteSpace: "pre-wrap" }}>{card.callout}</p> : null}
          {card.summaryText && style.summaryBoxStyle !== "hidden" ? (
            <div
              style={{
                marginTop: "4cqw",
                padding: "2.4cqw 3cqw",
                borderRadius: "2cqw",
                border: style.summaryBoxStyle === "outline" ? `2px solid ${brand.accentColor}` : "none",
                color: style.summaryBoxStyle === "solid" ? "white" : textColor,
                background:
                  style.summaryBoxStyle === "solid"
                    ? brand.primaryColor
                    : style.summaryBoxStyle === "soft"
                      ? `${brand.accentColor}33`
                      : "transparent",
                fontSize: "2.35cqw",
                fontWeight: 750,
                lineHeight: 1.45,
              }}
            >
              {card.summaryText}
            </div>
          ) : null}
        </div>
      </div>

      {style.footerStyle !== "hidden" ? (
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between"
          style={{
            minHeight: style.footerStyle === "band" ? "7.6%" : "5.8%",
            padding: "0 6.6%",
            background: style.footerStyle === "band" ? brand.primaryColor : "transparent",
            color: style.footerStyle === "band" ? "white" : textColor,
            fontSize: "1.8cqw",
            fontWeight: 750,
          }}
        >
          <span>{brand.brandName}</span>
          <span>{brand.signatureCta}</span>
        </div>
      ) : null}

      {style.sourceBoxStyle !== "hidden" && card.slide === total ? (
        <div
          className="absolute inset-x-[6.6%] z-20"
          style={{
            bottom: style.footerStyle === "hidden" ? "4.5%" : "8.5%",
            padding: "1.7cqw 2.2cqw",
            borderRadius: style.sourceBoxStyle === "band" ? "1.2cqw" : 0,
            background: style.sourceBoxStyle === "band" ? (isDark ? "rgba(255,255,255,.14)" : "rgba(32,58,91,.08)") : "transparent",
            fontSize: "1.45cqw",
            lineHeight: 1.4,
            color: secondaryText,
          }}
        >
          SOURCE · {card.source}
        </div>
      ) : null}

      {brand.logoDataUrl && style.logoPosition !== "hidden" ? (
        <img src={brand.logoDataUrl} alt={brand.brandName} className="absolute z-30 max-h-[4.5%] max-w-[14%] object-contain" style={logoPlacement[style.logoPosition]} />
      ) : null}
    </div>
  );
});

export function LivePreviewEditor({
  contentId,
  initialCards,
  creative,
  brand,
  engine,
  outputType = "INSTAGRAM_KR",
  demoMode = false,
}: {
  contentId: string;
  initialCards: InstagramCard[];
  creative: CreativeBrief;
  brand: BrandProfile;
  engine?: InstagramEnginePlan | null;
  outputType?: "INSTAGRAM_KR" | "INSTAGRAM_EN";
  demoMode?: boolean;
}) {
  const [cards, setCards] = useState(() =>
    normalizeCards(initialCards).map((item, index) =>
      initialCards[index]?.style
        ? item
        : {
            ...item,
            style: {
              ...item.style!,
              background:
                index === 0
                  ? brand.primaryColor
                  : index % 3 === 1
                    ? "#F3F5F7"
                    : index % 3 === 2
                      ? brand.secondaryColor
                      : "#FFFFFF",
            },
          },
    ),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [imageBusy, setImageBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle>(creative.contentAngles[0]);
  const [humorLevel, setHumorLevel] = useState(brand.humorLevel);
  const [engineDraft, setEngineDraft] = useState<InstagramEnginePlan | null>(engine ?? null);
  const [previewMode, setPreviewMode] = useState<"CARD" | "CAROUSEL" | "GRID">("CARD");
  const [publishModal, setPublishModal] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishInfo, setPublishInfo] = useState<{ account: InstagramAccount; limit: { usage: number; total: number | null } | null } | null>(null);
  const [publishJob, setPublishJob] = useState<{ id: string; status: string; permalink?: string; errorMessage?: string | null } | null>(null);
  const [versions, setVersions] = useState<Array<{ id: string; versionNumber: number; snapshot: { cards: InstagramCard[]; engine: InstagramEnginePlan | null }; score: number; hookText: string; cardCount: number; createdAt: string }> | null>(null);
  const firstRender = useRef(true);
  const exportRefs = useRef<Array<HTMLDivElement | null>>([]);
  const card = cards[activeIndex];
  const caption = engineDraft?.caption.fullText ?? "";
  const quality = useMemo(() => scoreInstagram(cards, caption), [cards, caption]);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    fetch(`/api/instagram/publish?contentId=${encodeURIComponent(contentId)}&outputType=${outputType}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { job?: typeof publishJob }) => { if (active && payload.job) setPublishJob(payload.job); });
    return () => { active = false; };
  }, [contentId, demoMode, outputType]);

  useEffect(() => {
    if (demoMode) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/contents/${contentId}/instagram`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outputType, cards, engine: engineDraft ? { ...engineDraft, cardCount: cards.length, caption: { ...engineDraft.caption, fullText: caption }, quality } : undefined }),
        });
        if (!response.ok) throw new Error("카드 저장에 실패했습니다.");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [cards, contentId, demoMode, engineDraft, caption, quality, outputType]);

  function updateCard(patch: Partial<InstagramCard>) {
    setCards((current) => current.map((item, index) => index === activeIndex ? { ...item, ...patch } : item));
  }

  function updateStyle<K extends keyof InstagramCardStyle>(key: K, value: InstagramCardStyle[K]) {
    updateCard({ style: { ...card.style!, [key]: value } });
  }

  function navigate(offset: number) {
    setActiveIndex((current) => Math.max(0, Math.min(cards.length - 1, current + offset)));
  }

  function moveCard(offset: number) {
    const nextIndex = activeIndex + offset;
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    setCards((current) => {
      const next = [...current];
      [next[activeIndex], next[nextIndex]] = [next[nextIndex], next[activeIndex]];
      return normalizeCards(next);
    });
    setActiveIndex(nextIndex);
  }

  function duplicateCard() {
    if (cards.length >= 20) return;
    const duplicate = { ...card, style: { ...card.style! }, headline: `${card.headline} (복사)` };
    setCards((current) => normalizeCards([...current.slice(0, activeIndex + 1), duplicate, ...current.slice(activeIndex + 1)]));
    setActiveIndex(activeIndex + 1);
  }

  function deleteCard() {
    if (cards.length === 1) return;
    setCards((current) => normalizeCards(current.filter((_, index) => index !== activeIndex)));
    setActiveIndex(Math.max(0, activeIndex - 1));
  }

  function addToBody(text: string) {
    updateCard({ body: `${card.body.trim()}\n\n${text}`.trim() });
  }

  function toggleLock(key: "headline" | "image" | "card") {
    updateCard({ locks: { headline: Boolean(card.locks?.headline), image: Boolean(card.locks?.image), card: Boolean(card.locks?.card), [key]: !card.locks?.[key] } });
  }

  function quickEdit(kind: "shorter" | "punchier" | "easier" | "fun" | "curious" | "less") {
    if (card.locks?.card) return;
    let body = card.body;
    let headline = card.headline;
    if (kind === "shorter" || kind === "less") body = body.split(/\n+|(?<=[.!?요다])\s+/).filter(Boolean).slice(0, kind === "less" ? 2 : 3).join("\n");
    if (!card.locks?.headline && kind === "punchier") headline = headline.replace(/[.!?]+$/, "");
    if (!card.locks?.headline && kind === "curious" && !headline.endsWith("?")) headline = `${headline}?`;
    if (kind === "easier") body = body.replace(/생체역학/g, "몸이 힘을 나누는 방식").replace(/가동성/g, "움직일 수 있는 범위");
    if (kind === "fun") body = `${body}\n${creative.humorLines[0] ?? "몸도 팀플레이가 필요해."}`;
    updateCard({ headline, body, textDensity: getTextDensity({ ...card, headline, body }) });
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8_000_000) {
      setEditorError("이미지는 8MB 이하 파일만 사용할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateStyle("imageDataUrl", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function regenerateImage() {
    setImageBusy(true);
    setEditorError("");
    try {
      const response = await fetch(
        demoMode ? "/api/preview/image" : `/api/contents/${contentId}/instagram/image`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: card.imageDescription }),
        },
      );
      const payload = (await response.json()) as { imageDataUrl?: string; error?: string };
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error || "이미지 생성에 실패했습니다.");
      updateStyle("imageDataUrl", payload.imageDataUrl);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "이미지 생성에 실패했습니다.");
    } finally {
      setImageBusy(false);
    }
  }

  async function exportCard(index: number) {
    const node = exportRefs.current[index];
    if (!node) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(node, { width: 1080, height: 1350, canvasWidth: 1080, canvasHeight: 1350, pixelRatio: 1, cacheBust: true });
    const link = document.createElement("a");
    link.download = `${brand.brandName}-card-${String(index + 1).padStart(2, "0")}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function exportCurrent() {
    setExportBusy(true);
    setEditorError("");
    try { await exportCard(activeIndex); } catch { setEditorError("PNG 내보내기에 실패했습니다. 이미지가 완전히 로드된 뒤 다시 시도해 주세요."); } finally { setExportBusy(false); }
  }

  async function openPublishConfirmation() {
    setPublishBusy(true); setEditorError("");
    try {
      const [accountResponse, healthResponse] = await Promise.all([fetch("/api/instagram/account", { cache: "no-store" }), fetch("/api/instagram/health", { method: "POST" })]);
      const accountPayload = await accountResponse.json() as { account: InstagramAccount | null };
      const healthPayload = await healthResponse.json() as { health?: { ready: boolean; messages: string[] }; limit?: { usage: number; total: number | null } | null; error?: string };
      if (!accountPayload.account) throw new Error("Settings에서 Instagram 계정을 먼저 연결해 주세요.");
      if (!healthPayload.health?.ready) throw new Error(healthPayload.health?.messages.join(" ") || healthPayload.error || "게시 사전검사를 통과하지 못했습니다.");
      if (!engineDraft || !caption.trim()) throw new Error("Instagram Caption이 준비되지 않았습니다.");
      if (quality.warnings.some((warning) => warning.severity === "error")) throw new Error("치명적인 품질 오류를 먼저 해결해 주세요.");
      setPublishInfo({ account: accountPayload.account, limit: healthPayload.limit ?? null }); setPublishModal(true);
    } catch (error) { setEditorError(error instanceof Error ? error.message : "게시 사전검사 실패"); } finally { setPublishBusy(false); }
  }

  async function improveInstagram() {
    if (!demoMode && engineDraft) {
      await fetch(`/api/contents/${contentId}/instagram`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outputType, cards, engine: { ...engineDraft, quality }, createVersion: true }) });
    }
    setCards((current) => improveUnlockedCards(current));
  }

  async function openVersions() {
    if (demoMode) return;
    const response = await fetch(`/api/contents/${contentId}/instagram?outputType=${outputType}`);
    const payload = await response.json() as { versions?: NonNullable<typeof versions>; error?: string };
    if (!response.ok) { setEditorError(payload.error || "버전 기록을 불러오지 못했습니다."); return; }
    setVersions(payload.versions ?? []);
  }

  function restoreVersion(version: NonNullable<typeof versions>[number]) {
    setCards(normalizeCards(version.snapshot.cards));
    setEngineDraft(version.snapshot.engine);
    setActiveIndex(0);
    setVersions(null);
  }

  async function confirmPublish() {
    setPublishBusy(true); setEditorError("");
    try {
      const { toJpeg } = await import("html-to-image");
      const images: string[] = [];
      for (const node of exportRefs.current.slice(0, cards.length)) {
        if (!node) throw new Error("카드 렌더링을 찾을 수 없습니다.");
        images.push(await toJpeg(node, { width: 1080, height: 1350, canvasWidth: 1080, canvasHeight: 1350, pixelRatio: 1, quality: .94, cacheBust: true }));
      }
      const response = await fetch("/api/instagram/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentId, outputType, caption, images, confirmed: true }) });
      const payload = await response.json() as { job?: { id: string; status: string }; error?: string };
      if (!response.ok || !payload.job) throw new Error(payload.error || "게시 작업을 만들지 못했습니다.");
      setPublishJob(payload.job); setPublishModal(false);
      let current: { id: string; status: string; nextPollAt?: string | null; permalink?: string; errorMessage?: string | null } = payload.job;
      for (let count = 0; count < 20 && !["PUBLISHED", "FAILED"].includes(current.status); count++) {
        const advance = await fetch(`/api/instagram/publish/${current.id}`, { method: "POST" });
        const next = await advance.json() as { job?: typeof current & { nextPollAt?: string | null; permalink?: string; errorMessage?: string | null }; error?: string };
        if (!advance.ok || !next.job) throw new Error(next.error || "게시 진행을 확인하지 못했습니다.");
        current = next.job; setPublishJob(current);
        const nextPollAt = current.nextPollAt;
        if (nextPollAt) await new Promise((resolve) => window.setTimeout(resolve, Math.max(500, new Date(nextPollAt).getTime() - Date.now())));
      }
    } catch (error) { setEditorError(error instanceof Error ? error.message : "Instagram 게시 실패"); } finally { setPublishBusy(false); }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d7e3e0] bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#5f716e]">
          <span className={`size-2 rounded-full ${saveState === "saved" ? "bg-[#3b8a7d]" : saveState === "saving" ? "animate-pulse bg-[#c28a38]" : "bg-[#b65047]"}`} />
          {demoMode ? "체험 모드 · 변경사항은 현재 화면에만 유지" : saveState === "saved" ? "모든 변경사항 저장됨" : saveState === "saving" ? "자동 저장 중…" : "저장 오류"}
        </div>
        <div className="flex gap-2">
          {!demoMode ? <button className="btn-secondary" type="button" onClick={() => void openVersions()}><History size={15} /> 이전 버전</button> : null}
          {!demoMode ? <button className="btn-primary" type="button" onClick={() => void openPublishConfirmation()} disabled={publishBusy || !engineDraft}><Send size={15} /> {publishBusy ? "사전검사 중…" : "Instagram에 게시"}</button> : null}
          <button className="btn-secondary" type="button" onClick={() => void exportCurrent()} disabled={exportBusy}><Download size={15} /> {exportBusy ? "렌더링 중…" : "Export PNG · 1080×1350"}</button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[430px_minmax(480px,1fr)]">
        <section className="panel max-h-[calc(100vh-120px)] overflow-y-auto p-5">
          <div className="mb-5 flex items-center justify-between"><div><span className="eyebrow">Editing</span><h2 className="mt-1 text-lg font-extrabold">Card {activeIndex + 1}</h2></div><div className="flex gap-1"><button type="button" className="btn-secondary !size-9 !min-h-9 !p-0" onClick={() => moveCard(-1)} aria-label="앞으로 이동"><ArrowUp size={15} /></button><button type="button" className="btn-secondary !size-9 !min-h-9 !p-0" onClick={() => moveCard(1)} aria-label="뒤로 이동"><ArrowDown size={15} /></button></div></div>

          <div className="space-y-4">
            <Field label="Headline"><textarea className="field-textarea !min-h-24" value={card.headline} onChange={(e) => updateCard({ headline: e.target.value })} /></Field>
            <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => toggleLock("headline")}>{card.locks?.headline ? <Lock size={14} /> : <Unlock size={14} />} Headline</button><button type="button" className="btn-secondary" onClick={() => toggleLock("image")}>{card.locks?.image ? <Lock size={14} /> : <Unlock size={14} />} Image</button><button type="button" className="btn-secondary" onClick={() => toggleLock("card")}>{card.locks?.card ? <Lock size={14} /> : <Unlock size={14} />} Card</button></div>
            <Field label="Subheadline"><textarea className="field-textarea !min-h-20" value={card.subheadline ?? ""} onChange={(e) => updateCard({ subheadline: e.target.value })} /></Field>
            <Field label="Body text"><textarea className="field-textarea !min-h-36" value={card.body} onChange={(e) => updateCard({ body: e.target.value })} /></Field>
            <Field label="Callout"><textarea className="field-textarea !min-h-20" value={card.callout ?? ""} onChange={(e) => updateCard({ callout: e.target.value })} /></Field>
            <div className="rounded-xl bg-[#f4f8f6] p-3"><div className="flex items-center justify-between text-xs font-extrabold"><span>Text Density</span><span className={getTextDensity(card) === "TOO_HIGH" ? "text-[#b44f45]" : "text-[#23806f]"}>{getTextDensity(card)}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{[["shorter", "Shorter"], ["punchier", "Punchier"], ["easier", "Easier"], ["fun", "More Fun"], ["curious", "More Curious"], ["less", "Less Text"]].map(([key, label]) => <button type="button" className="tag" key={key} onClick={() => quickEdit(key as "shorter" | "punchier" | "easier" | "fun" | "curious" | "less")}><Sparkles size={11} /> {label}</button>)}</div></div>
            <Field label="Bottom summary box"><textarea className="field-textarea !min-h-20" value={card.summaryText ?? ""} onChange={(e) => updateCard({ summaryText: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category badge"><input className="field-input" value={card.categoryBadge ?? ""} onChange={(e) => updateCard({ categoryBadge: e.target.value })} /></Field>
              <Field label="Text position"><select className="field-select" value={card.style!.textPosition} onChange={(e) => updateStyle("textPosition", e.target.value as InstagramCardStyle["textPosition"])}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></Field>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["left", "center", "right"] as const).map((align) => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                return <button type="button" key={align} className={card.style!.textAlign === align ? "btn-quiet" : "btn-secondary"} onClick={() => updateStyle("textAlign", align)}><Icon size={15} /> {align}</button>;
              })}
            </div>

            <Range label="Headline size" value={card.style!.headlineSize} min={36} max={88} unit="px" onChange={(value) => updateStyle("headlineSize", value)} />
            <Range label="Body size" value={card.style!.bodySize} min={20} max={46} unit="px" onChange={(value) => updateStyle("bodySize", value)} />
            <Range label="Line spacing" value={card.style!.lineHeight} min={1} max={2} step={0.05} onChange={(value) => updateStyle("lineHeight", value)} />
            <Range label="Outer spacing" value={card.style!.spacing} min={42} max={120} unit="px" onChange={(value) => updateStyle("spacing", value)} />
            <Field label="Font weight"><select className="field-select" value={card.style!.fontWeight} onChange={(e) => updateStyle("fontWeight", Number(e.target.value) as InstagramCardStyle["fontWeight"])}>{[400, 500, 600, 700, 800].map((weight) => <option key={weight}>{weight}</option>)}</select></Field>

            <div className="border-t border-[#e4ebe9] pt-4">
              <span className="field-label">Background</span>
              <div className="flex flex-wrap gap-2">{[brand.primaryColor, brand.secondaryColor, brand.accentColor, "#F3F5F7", "#FFFFFF", ...defaultCardBackgrounds].filter((color, index, list) => list.indexOf(color) === index).map((color) => <button key={color} type="button" className={`size-9 rounded-full border-2 ${card.style!.background === color ? "border-[#172d2b]" : "border-white shadow"}`} style={{ background: color }} onClick={() => updateStyle("background", color)} aria-label={`배경 ${color}`} />)}<input type="color" className="size-9 rounded-full" value={card.style!.background.match(/^#[0-9a-f]{6}$/i)?.[0] ?? brand.primaryColor} onChange={(e) => updateStyle("background", e.target.value)} /></div>
            </div>

            <div className="border-t border-[#e4ebe9] pt-4">
              <Field label="Image brief"><textarea className="field-textarea !min-h-28" value={card.imageDescription} onChange={(e) => updateCard({ imageDescription: e.target.value })} /></Field>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="btn-secondary cursor-pointer"><ImagePlus size={15} /> Image<input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadImage(e.target.files?.[0])} /></label>
                <button type="button" className="btn-primary" onClick={() => void regenerateImage()} disabled={imageBusy}><RefreshCw size={15} className={imageBusy ? "animate-spin" : ""} /> {imageBusy ? "Generating…" : "Regenerate Image"}</button>
                {card.style!.imageDataUrl ? <button type="button" className="btn-secondary" onClick={() => updateStyle("imageDataUrl", "")}>Remove</button> : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3"><Range label="Image size" value={card.style!.imageSize} min={20} max={100} unit="%" onChange={(value) => updateStyle("imageSize", value)} /><Field label="Image position"><select className="field-select" value={card.style!.imagePosition} onChange={(e) => updateStyle("imagePosition", e.target.value as InstagramCardStyle["imagePosition"])}>{["top", "center", "bottom", "left", "right"].map((position) => <option key={position}>{position}</option>)}</select></Field></div>
            </div>

            <div className="border-t border-[#e4ebe9] pt-4">
              <h3 className="mb-3 text-sm font-extrabold">Brand elements</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Logo position"><select className="field-select" value={card.style!.logoPosition} onChange={(e) => updateStyle("logoPosition", e.target.value as InstagramCardStyle["logoPosition"])}>{["top-left", "top-right", "bottom-left", "bottom-right", "hidden"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                <Field label="Footer style"><select className="field-select" value={card.style!.footerStyle} onChange={(e) => updateStyle("footerStyle", e.target.value as InstagramCardStyle["footerStyle"])}>{["compact", "band", "hidden"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                <Field label="Badge style"><select className="field-select" value={card.style!.badgeStyle} onChange={(e) => updateStyle("badgeStyle", e.target.value as InstagramCardStyle["badgeStyle"])}>{["pill", "square", "outline", "hidden"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                <Field label="Summary box"><select className="field-select" value={card.style!.summaryBoxStyle} onChange={(e) => updateStyle("summaryBoxStyle", e.target.value as InstagramCardStyle["summaryBoxStyle"])}>{["soft", "solid", "outline", "hidden"].map((value) => <option key={value}>{value}</option>)}</select></Field>
                <Field label="Source box"><select className="field-select" value={card.style!.sourceBoxStyle} onChange={(e) => updateStyle("sourceBoxStyle", e.target.value as InstagramCardStyle["sourceBoxStyle"])}>{["plain", "band", "hidden"].map((value) => <option key={value}>{value}</option>)}</select></Field>
              </div>
            </div>

            <div className="border-t border-[#e4ebe9] pt-4">
              <h3 className="mb-2 text-sm font-extrabold">Hook Generator</h3>
              <div className="space-y-2">{creative.hooks.map((hook) => <button key={hook.type} type="button" className="w-full rounded-xl border border-[#dce6e3] bg-[#f9fbfa] p-3 text-left hover:border-[#8db4ab]" onClick={() => updateCard({ headline: hook.text })}><span className="flex justify-between text-[0.65rem] font-extrabold uppercase tracking-wider text-[#176b63]"><span>{hook.type}</span><span>{hook.score} · risk {hook.clickbaitRisk}</span></span><span className="mt-1 block text-xs font-bold leading-5">{hook.text}</span></button>)}</div>
            </div>

            <div className="border-t border-[#e4ebe9] pt-4">
              <h3 className="mb-2 text-sm font-extrabold">Angle & voice</h3>
              <select className="field-select" value={selectedAngle.type} onChange={(e) => { const angle = creative.contentAngles.find((item) => item.type === e.target.value) ?? creative.contentAngles[0]; setSelectedAngle(angle); setEngineDraft((current) => current ? { ...current, selectedAngleType: angle.type } : current); }}>{creative.contentAngles.map((angle) => <option key={angle.type} value={angle.type}>{angle.title}</option>)}</select>
              <p className="rounded-xl bg-[#f3f7f5] p-3 text-xs leading-5 text-[#536663]">{selectedAngle.description}<span className="mt-1 block font-bold">Save {selectedAngle.saveValue} · Share {selectedAngle.shareValue} · {selectedAngle.recommendedCardCount} cards</span></p>
              <button type="button" className="btn-secondary w-full" onClick={() => addToBody(selectedAngle.description)}>이 관점을 본문에 추가</button>
              <Range label="Humor intensity" value={humorLevel} min={0} max={5} step={0.5} onChange={setHumorLevel} />
              <div className="flex flex-wrap gap-1.5">{creative.humorLines.map((line) => <button type="button" className="tag" key={line} onClick={() => addToBody(line)}>{line}</button>)}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">{brand.recurringPhrases.map((line) => <button type="button" className="tag" key={line} onClick={() => addToBody(line)}>{line}</button>)}<button type="button" className="tag !border-[#eab4ac] !bg-[#fff4f2] !text-[#8e423a]" onClick={() => addToBody(brand.signatureCta)}>+ CTA</button></div>
            </div>
          </div>
        </section>

        <section className="sticky top-5 min-w-0">
          <div className="panel mx-auto max-w-[680px] overflow-hidden p-3 md:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1"><span className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#6e7f7c]">Live Preview</span><div className="flex gap-1">{(["CARD", "CAROUSEL", "GRID"] as const).map((mode) => <button type="button" className={previewMode === mode ? "btn-quiet !min-h-8 !px-2" : "btn-secondary !min-h-8 !px-2"} key={mode} onClick={() => setPreviewMode(mode)}>{mode}</button>)}</div><span className="rounded-md bg-[#edf3f1] px-2 py-1 text-[0.68rem] font-bold text-[#60726f]">1080 × 1350 · 4:5</span></div>
            {previewMode === "CARD" ? <div className="overflow-hidden rounded-xl shadow-[0_24px_65px_rgba(22,52,49,.18)]"><CardArtwork card={card} total={cards.length} brand={brand} /></div> : previewMode === "CAROUSEL" ? <div className="flex snap-x gap-3 overflow-x-auto pb-3">{cards.map((item, index) => <button type="button" className="w-[72%] shrink-0 snap-center overflow-hidden rounded-xl" key={index} onClick={() => setActiveIndex(index)}><CardArtwork card={item} total={cards.length} brand={brand} /></button>)}</div> : <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#eef2f1] p-3">{cards.map((item, index) => <button type="button" className="overflow-hidden rounded-lg" key={index} onClick={() => setActiveIndex(index)}><CardArtwork card={item} total={cards.length} brand={brand} /></button>)}</div>}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <button type="button" className="btn-secondary !px-2" onClick={() => navigate(-1)} disabled={activeIndex === 0}><ArrowLeft size={14} /> Previous</button>
              <button type="button" className="btn-secondary !px-2" onClick={() => navigate(1)} disabled={activeIndex === cards.length - 1}>Next <ArrowRight size={14} /></button>
              <button type="button" className="btn-secondary !px-2" onClick={duplicateCard}><Copy size={14} /> Duplicate</button>
              <button type="button" className="btn-secondary !px-2 !text-[#a8453c]" onClick={deleteCard} disabled={cards.length === 1}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </section>
      </div>

      {editorError ? <div className="mt-4 rounded-xl border border-[#efc8c2] bg-[#fff4f2] px-4 py-3 text-sm font-bold text-[#9a433a]">{editorError}</div> : null}

      <section className="panel mt-5 p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="section-title">전체 카드</h2><span className="text-xs font-bold text-[#738380]">클릭해서 빠르게 이동 · 화살표로 순서 변경</span></div>
        <div className="flex gap-3 overflow-x-auto pb-2">{cards.map((item, index) => <button draggable type="button" key={`${index}-${item.headline}`} onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData("text/plain")); if (!Number.isInteger(from) || from === index) return; setCards((current) => { const next = [...current]; const [moved] = next.splice(from, 1); next.splice(index, 0, moved); return normalizeCards(next); }); setActiveIndex(index); }} onClick={() => setActiveIndex(index)} className={`w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${activeIndex === index ? "border-[#176b63]" : "border-transparent hover:border-[#b8ccc7]"}`}><div className="overflow-hidden rounded-lg"><CardArtwork card={item} total={cards.length} brand={brand} /></div><span className="mt-1.5 block truncate px-1 text-[0.65rem] font-extrabold">{index + 1}. {item.headline}</span></button>)}</div>
      </section>

      {engineDraft ? <section className="panel mt-5 grid gap-5 p-5 xl:grid-cols-[1fr_320px]"><div><div className="flex items-center justify-between"><h2 className="section-title">Final Caption</h2><button type="button" className="btn-secondary" onClick={() => navigator.clipboard.writeText(caption)}>Copy</button></div><textarea className="field-textarea mt-3 min-h-56" value={caption} onChange={(event) => setEngineDraft((current) => current ? { ...current, caption: { ...current.caption, fullText: event.target.value } } : current)} /><div className="mt-3 flex flex-wrap gap-1.5">{Object.values(engineDraft.hashtags).flat().map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><div className="rounded-2xl bg-[#203A5B] p-5 text-white"><span className="text-[.65rem] font-black tracking-widest text-[#88C9C1]">INSTAGRAM QUALITY</span><strong className="mt-2 block text-5xl">{quality.total}</strong><span className="text-xs">/ 100 · {quality.ready ? "Ready" : "Needs review"}</span><div className="mt-4 grid grid-cols-2 gap-2 text-xs">{Object.entries(quality.scores).map(([key, value]) => <span className="flex justify-between border-b border-white/15 py-1" key={key}>{key.toUpperCase()} <strong>{value}</strong></span>)}</div><button type="button" className="mt-4 w-full rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-[#203A5B]" onClick={() => void improveInstagram()}>AI로 개선</button></div>{quality.warnings.length ? <div className="xl:col-span-2">{quality.warnings.map((warning, index) => <p className="mb-2 rounded-lg bg-[#fff5f3] p-3 text-xs font-bold text-[#93483f]" key={`${warning.card}-${index}`}>{warning.card ? `Card ${warning.card} · ` : ""}{warning.message}</p>)}</div> : null}</section> : null}

      {publishJob ? <section className={`panel mt-5 p-5 ${publishJob.status === "FAILED" ? "border-[#e7bcb5]" : "border-[#b8d9d1]"}`}><h2 className="section-title">{publishJob.status === "PUBLISHED" ? "✅ Instagram 게시 완료" : publishJob.status === "FAILED" ? "게시 실패" : "Instagram에 게시 중"}</h2><p className="text-sm font-bold">현재 단계 · {publishJob.status}</p><p className="text-xs text-[#6b7b78]">로컬 서버를 끄면 작업이 멈춥니다. 다시 실행하면 저장된 Job 상태를 조회할 수 있습니다.</p>{publishJob.errorMessage ? <p className="text-sm text-[#a2473f]">{publishJob.errorMessage}</p> : null}{publishJob.permalink ? <a className="btn-primary" href={publishJob.permalink} target="_blank" rel="noreferrer">Instagram에서 보기</a> : null}</section> : null}

      {publishModal && publishInfo ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#10211f]/70 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><span className="eyebrow">Final confirmation</span><h2 className="mt-2 text-2xl font-black">Instagram 게시 확인</h2><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><InfoRow label="OUTPUT" value={outputType === "INSTAGRAM_EN" ? "English Instagram" : "한국어 Instagram"} /><InfoRow label="ACCOUNT" value={`@${publishInfo.account.username}`} /><InfoRow label="CAROUSEL" value={`${cards.length} cards`} /><InfoRow label="IMAGE" value="1080 × 1350 JPEG" /><InfoRow label="CAPTION" value="Ready" /><InfoRow label="SOURCE" value="Included" /><InfoRow label="QUALITY" value={`${quality.total} / 100`} /><InfoRow label="BRAND" value={`${quality.scores.brand} / 100`} /><InfoRow label="LIMIT" value={`${publishInfo.limit?.usage ?? "-"} / ${publishInfo.limit?.total ?? "API limit"}`} /></div><p className="mt-5 rounded-xl bg-[#fff4f2] p-4 text-sm font-extrabold text-[#8f4139]">게시를 누르면 실제 Instagram 계정에 공개됩니다. LIVE 모드에서는 되돌릴 수 없습니다.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" type="button" onClick={() => setPublishModal(false)}>취소</button><button className="btn-primary" type="button" onClick={() => void confirmPublish()} disabled={publishBusy}><Send size={15} /> Instagram에 게시</button></div></div></div> : null}
      {versions ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#10211f]/70 p-4"><div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Version History</h2><button className="btn-secondary" type="button" onClick={() => setVersions(null)}>닫기</button></div><div className="mt-4 space-y-2">{versions.length ? versions.map((version) => <button type="button" className="w-full rounded-xl border border-[#dce6e3] p-4 text-left hover:bg-[#f4f8f6]" key={version.id} onClick={() => restoreVersion(version)}><span className="flex justify-between text-sm font-extrabold"><span>Version {version.versionNumber} · {version.cardCount} cards</span><span>{version.score}/100</span></span><span className="mt-1 block truncate text-xs text-[#657572]">{version.hookText || "Hook snapshot"} · {new Date(version.createdAt).toLocaleString("ko-KR")}</span></button>) : <p className="text-sm text-[#6b7b78]">아직 저장된 이전 버전이 없습니다.</p>}</div></div></div> : null}

      <div aria-hidden="true" className="fixed left-[-20000px] top-0">
        {cards.map((item, index) => <CardArtwork key={index} ref={(node) => { exportRefs.current[index] = node; }} card={item} total={cards.length} brand={brand} exportMode />)}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f4f8f6] p-3"><span className="block text-[.6rem] font-black tracking-wider text-[#6c7d79]">{label}</span><strong className="mt-1 block">{value}</strong></div>;
}

function Range({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  return <label className="block"><span className="field-label flex justify-between"><span>{label}</span><strong>{value}{unit}</strong></span><input className="w-full accent-[#203A5B]" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}
