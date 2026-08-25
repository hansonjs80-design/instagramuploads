import { NextResponse } from "next/server";
import { AiConfigurationError, getConfiguredModel } from "@/lib/ai/generate";
import { describeGenerationFailure } from "@/lib/ai/error-message";
import {
  generateInstagram,
  generateNaverKr,
  getOrCreateCoreResearch,
  instagramLocaleForOutput,
} from "@/lib/ai/generate-selected";
import { assertTransformativeOutput, CopyrightGuardError } from "@/lib/content/copyright-guard";
import { assertSafeMedicalOutput } from "@/lib/content/medical-language-guard";
import type { InstagramOutputData, NaverOutputData } from "@/lib/content/types";
import { InputError, parseOutputTypes } from "@/lib/content/validation";
import {
  getContentById,
  markGenerationError,
  saveCoreResearch,
  saveInstagramOutput,
  saveNaverOutput,
} from "@/lib/db/repository";

export const runtime = "nodejs";
export const maxDuration = 300;

type GeneratedResult =
  | { outputType: "NAVER_BLOG_KR"; data: NaverOutputData }
  | { outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN"; data: InstagramOutputData };

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const content = await getContentById(id);
  if (!content) return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });

  try {
    const raw = await request.text();
    const body = raw ? JSON.parse(raw) as { outputTypes?: unknown } : {};
    const selected = parseOutputTypes(body.outputTypes, content.selectedOutputTypes);
    const model = getConfiguredModel();
    const core = await getOrCreateCoreResearch(content);
    if (!core.reused) await saveCoreResearch(id, core.result.analysis, core.result.suggestedTags, model);

    const generated = await Promise.all(selected.map(async (outputType): Promise<GeneratedResult> => {
      if (outputType === "NAVER_BLOG_KR") {
        return { outputType, data: await generateNaverKr(content, core.result.analysis) };
      }
      return { outputType, data: await generateInstagram(content, core.result.analysis, instagramLocaleForOutput(outputType)) };
    }));

    for (const output of generated) {
      assertTransformativeOutput(content.originalScript, output.data);
      assertSafeMedicalOutput(output.data);
      if (output.outputType === "NAVER_BLOG_KR") await saveNaverOutput(id, output.data, model);
      else await saveInstagramOutput(id, output.outputType, output.data, model);
    }
    return NextResponse.json({ content: await getContentById(id), generatedOutputTypes: selected, coreResearchReused: core.reused });
  } catch (error) {
    const failure = describeGenerationFailure(error);
    await markGenerationError(id, failure.message);
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: failure.message, code: failure.code, actionUrl: failure.actionUrl }, { status: 503 });
    if (error instanceof CopyrightGuardError || error instanceof InputError) return NextResponse.json({ error: failure.message }, { status: 422 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "요청 JSON 형식이 올바르지 않습니다." }, { status: 400 });
    if (failure.code === "OPENAI_QUOTA_EXCEEDED" || failure.code === "OPENAI_RATE_LIMITED") {
      console.warn("AI generation unavailable", { contentId: id, code: failure.code, status: failure.status });
    } else {
      console.error("Failed to generate selected content", error);
    }
    return NextResponse.json({ error: failure.message, code: failure.code, actionUrl: failure.actionUrl }, { status: failure.status });
  }
}
