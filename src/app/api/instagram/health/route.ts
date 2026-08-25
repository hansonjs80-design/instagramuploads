import { NextResponse } from "next/server";
import { checkInstagramHealth } from "@/services/instagram/health";

export const runtime = "nodejs";
export async function POST() {
  try { return NextResponse.json(await checkInstagramHealth()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "연결 검사 실패" }, { status: 400 }); }
}
