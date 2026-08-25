import { NextResponse } from "next/server";
import { normalizeCards } from "@/lib/content/card-editor";
import type { InstagramCard, InstagramEnginePlan } from "@/lib/content/types";
import { getContentById, listInstagramOutputVersions, saveInstagramEditor } from "@/lib/db/repository";

export const runtime = "nodejs";

function parseOutputType(value: unknown): "INSTAGRAM_KR" | "INSTAGRAM_EN" {
  return value === "INSTAGRAM_EN" ? "INSTAGRAM_EN" : "INSTAGRAM_KR";
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const outputType = parseOutputType(new URL(request.url).searchParams.get("outputType"));
  return await getContentById(id) ? NextResponse.json({ versions: await listInstagramOutputVersions(id, outputType), outputType }) : NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });
}

function parseCards(value: unknown): InstagramCard[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new Error("카드는 1장 이상 20장 이하로 저장할 수 있습니다.");
  }
  return normalizeCards(
    value.map((item) => {
      if (!item || typeof item !== "object") throw new Error("카드 형식이 올바르지 않습니다.");
      const card = item as Partial<InstagramCard>;
      if (
        typeof card.headline !== "string" ||
        typeof card.body !== "string" ||
        typeof card.imageDescription !== "string" ||
        typeof card.source !== "string"
      ) {
        throw new Error("카드의 필수 텍스트가 누락되었습니다.");
      }
      return {
        slide: Number(card.slide) || 1,
        headline: card.headline.slice(0, 200),
        subheadline: typeof card.subheadline === "string" ? card.subheadline.slice(0, 240) : "",
        body: card.body.slice(0, 1200),
        callout: typeof card.callout === "string" ? card.callout.slice(0, 280) : "",
        imageDescription: card.imageDescription.slice(0, 1000),
        source: card.source.slice(0, 1000),
        categoryBadge: typeof card.categoryBadge === "string" ? card.categoryBadge.slice(0, 40) : "MOVEMENT",
        summaryText: typeof card.summaryText === "string" ? card.summaryText.slice(0, 280) : "",
        purpose: card.purpose,
        visualType: card.visualType,
        swipeFlow: card.swipeFlow,
        textDensity: card.textDensity,
        locks: card.locks,
        style: card.style,
      };
    }),
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!await getContentById(id)) {
    return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });
  }
  try {
    const body = (await request.json()) as { cards?: unknown; engine?: InstagramEnginePlan; createVersion?: boolean; outputType?: unknown };
    const cards = parseCards(body.cards);
    const outputType = parseOutputType(body.outputType);
    await saveInstagramEditor(id, outputType, cards, body.engine, Boolean(body.createVersion));
    return NextResponse.json({ cards, outputType });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "카드 저장에 실패했습니다." },
      { status: 400 },
    );
  }
}
