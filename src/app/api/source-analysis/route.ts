import { NextResponse } from "next/server";
import { analyzeSource } from "@/services/source-analysis/source-analyzer";
import { SourceAnalysisInputError } from "@/services/source-analysis/platform-detector";
import type { AnalysisMode } from "@/services/source-analysis/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown>;
    let mediaFile: File | null = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
      const candidate = form.get("mediaFile");
      mediaFile = candidate instanceof File && candidate.size > 0 ? candidate : null;
    } else {
      body = await request.json() as Record<string, unknown>;
    }
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    if (!sourceUrl) throw new SourceAnalysisInputError("분석할 콘텐츠 링크를 입력해 주세요.");
    const mode = (["FAST", "STANDARD", "DEEP"].includes(String(body.mode)) ? body.mode : "STANDARD") as AnalysisMode;
    const analysis = await analyzeSource({
      sourceUrl, mode,
      expertName: text(body.expertName), script: text(body.script), caption: text(body.caption),
      note: text(body.note), experienceNote: text(body.experienceNote), mediaFile,
      force: body.force === true || body.force === "true",
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "링크 분석에 실패했습니다.";
    const status = error instanceof SourceAnalysisInputError ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function text(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
