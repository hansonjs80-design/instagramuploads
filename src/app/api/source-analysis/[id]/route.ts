import { NextResponse } from "next/server";
import { classifyContent, mergeClassification } from "@/services/source-analysis/classification-engine";
import { getSourceAnalysis, updateSourceClassification } from "@/services/source-analysis/repository";
import type { ContentClassification } from "@/services/source-analysis/types";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = getSourceAnalysis(id);
  return analysis ? NextResponse.json({ analysis }) : NextResponse.json({ error: "분석 결과를 찾을 수 없습니다." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { classification?: ContentClassification };
    if (!body.classification || typeof body.classification !== "object") return NextResponse.json({ error: "저장할 분류 정보가 필요합니다." }, { status: 400 });
    return NextResponse.json({ analysis: updateSourceClassification(id, body.classification) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "분류 저장에 실패했습니다." }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = getSourceAnalysis(id);
    if (!current) return NextResponse.json({ error: "분석 결과를 찾을 수 없습니다." }, { status: 404 });
    await request.json().catch(() => ({}));
    const next = classifyContent(current.availableText, current.evidence);
    const classification = mergeClassification(current.classification, next);
    return NextResponse.json({ analysis: updateSourceClassification(id, classification) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "재분석에 실패했습니다." }, { status: 502 });
  }
}
