import { NextResponse } from "next/server";
import {
  AiConfigurationError,
  generateContentBundle,
  getConfiguredModel,
} from "@/lib/ai/generate";
import { assertTransformativeOutput, CopyrightGuardError } from "@/lib/content/copyright-guard";
import { assertSafeMedicalLanguage } from "@/lib/content/medical-language-guard";
import {
  getContentById,
  markGenerationError,
  saveGeneratedBundle,
} from "@/lib/db/repository";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const content = getContentById(id);
  if (!content) return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });

  try {
    const bundle = await generateContentBundle(content);
    assertTransformativeOutput(content.originalScript, bundle);
    assertSafeMedicalLanguage(bundle);
    saveGeneratedBundle(id, bundle, getConfiguredModel());
    return NextResponse.json({ content: getContentById(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 콘텐츠 생성에 실패했습니다.";
    markGenerationError(id, message);

    if (error instanceof AiConfigurationError) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    if (error instanceof CopyrightGuardError) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    console.error("Failed to generate content", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
