"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function GenerateButton({ contentId }: { contentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/contents/${contentId}/generate`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "생성에 실패했습니다.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void generate()}>
        <Sparkles size={16} /> {busy ? "브랜드 콘텐츠 생성 중…" : "AI 분석과 콘텐츠 생성"}
      </button>
      {error ? <p className="mt-2 max-w-sm text-xs font-bold text-[#a8453c]">{error}</p> : null}
    </div>
  );
}
