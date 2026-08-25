import { NextResponse } from "next/server";
import { advancePublishJob, getPublishJob } from "@/services/instagram/publishing";

export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = getPublishJob(jobId);
  return job ? NextResponse.json({ job }) : NextResponse.json({ error: "게시 작업을 찾을 수 없습니다." }, { status: 404 });
}
export async function POST(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try { const { jobId } = await context.params; return NextResponse.json({ job: await advancePublishJob(jobId) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "게시 진행 실패" }, { status: 400 }); }
}
