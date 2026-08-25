import { NextResponse } from "next/server";
import { createAuthorizationUrl } from "@/services/instagram/oauth";
import { getAppBaseUrl } from "@/services/instagram/config";

export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.redirect(createAuthorizationUrl()); }
  catch (error) {
    const base = getAppBaseUrl();
    if (!base) return NextResponse.json({ error: error instanceof Error ? error.message : "연결을 시작할 수 없습니다." }, { status: 500 });
    return NextResponse.redirect(new URL(`/settings?instagram_error=${encodeURIComponent(error instanceof Error ? error.message : "연결을 시작할 수 없습니다.")}`, base));
  }
}
