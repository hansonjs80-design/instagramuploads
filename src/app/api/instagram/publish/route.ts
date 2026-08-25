import { NextResponse } from "next/server";
import { createPublishJob, getLatestPublishJobByContent } from "@/services/instagram/publishing";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const contentId = new URL(request.url).searchParams.get("contentId");
  if (!contentId) return NextResponse.json({ error: "contentId가 필요합니다." }, { status: 400 });
  return NextResponse.json({ job: getLatestPublishJobByContent(contentId) });
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as { contentId?: unknown; caption?: unknown; images?: unknown; confirmed?: unknown; republish?: unknown };
    if (typeof body.contentId !== "string" || typeof body.caption !== "string" || !Array.isArray(body.images) || !body.images.every((image) => typeof image === "string")) throw new Error("게시 입력 형식이 올바르지 않습니다.");
    const job = await createPublishJob({ contentId: body.contentId, caption: body.caption.slice(0, 2200), images: body.images, confirmed: body.confirmed === true, republish: body.republish === true });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "게시 작업 생성 실패" }, { status: 400 }); }
}
