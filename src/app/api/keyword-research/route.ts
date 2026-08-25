import { NextResponse } from "next/server";
import { researchKeywords } from "@/lib/naver/keyword-research";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { topic?: unknown };
    if (typeof body.topic !== "string" || body.topic.trim().length < 2) {
      return NextResponse.json({ error: "주제를 2자 이상 입력해 주세요." }, { status: 400 });
    }
    const periodMonths = [1, 3, 6, 12, 24].includes(Number((body as { periodMonths?: unknown }).periodMonths)) ? Number((body as { periodMonths?: unknown }).periodMonths) : 12;
    return NextResponse.json({ result: await researchKeywords(body.topic.trim().slice(0, 100), periodMonths) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "키워드 분석에 실패했습니다." }, { status: 500 });
  }
}
