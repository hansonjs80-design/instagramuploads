import { NextResponse } from "next/server";
import { AiConfigurationError } from "@/lib/ai/generate";
import { generateCardImage } from "@/lib/ai/image";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string" || body.prompt.trim().length < 5) {
      return NextResponse.json({ error: "이미지 설명을 5자 이상 입력해 주세요." }, { status: 400 });
    }
    return NextResponse.json({ imageDataUrl: await generateCardImage(body.prompt.trim()) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "이미지 생성에 실패했습니다." },
      { status: error instanceof AiConfigurationError ? 503 : 502 },
    );
  }
}
