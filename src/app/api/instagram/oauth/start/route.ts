import { NextResponse } from "next/server";
import { createAuthorizationUrl } from "@/services/instagram/oauth";

export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.redirect(createAuthorizationUrl()); }
  catch (error) {
    const base = process.env.APP_BASE_URL;
    if (!base) return NextResponse.json({ error: error instanceof Error ? error.message : "연결을 시작할 수 없습니다." }, { status: 500 });
    return NextResponse.redirect(new URL(`/settings?instagram_error=${encodeURIComponent(error instanceof Error ? error.message : "연결을 시작할 수 없습니다.")}`, base));
  }
}
