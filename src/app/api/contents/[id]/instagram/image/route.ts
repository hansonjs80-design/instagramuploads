import { NextResponse } from "next/server";
import { AiConfigurationError } from "@/lib/ai/generate";
import { generateCardImage } from "@/lib/ai/image";
import { getContentById } from "@/lib/db/repository";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const content = getContentById(id);
  if (!content) return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });

  try {
    const body = (await request.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string" || body.prompt.trim().length < 5) {
      return NextResponse.json({ error: "이미지 설명을 5자 이상 입력해 주세요." }, { status: 400 });
    }
    const imageDataUrl = await generateCardImage(body.prompt.trim());
    return NextResponse.json({ imageDataUrl });
  } catch (error) {
    const status = error instanceof AiConfigurationError ? 503 : 502;
    console.error("Failed to generate card image", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "이미지 생성에 실패했습니다." },
      { status },
    );
  }
}
