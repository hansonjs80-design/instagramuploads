import { NextResponse } from "next/server";
import { saveInstagramAccount } from "@/services/instagram/account-repository";
import { getInstagramProvider } from "@/services/instagram/provider";
import { exchangeAuthorizationCode } from "@/services/instagram/oauth";
import { authProvider } from "@/lib/auth/provider";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = process.env.APP_BASE_URL || url.origin;
  if (!await authProvider.isAuthenticated()) return NextResponse.redirect(new URL("/login?next=/settings", base));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const denied = url.searchParams.get("error");
  if (!code || !state || denied) return NextResponse.redirect(new URL("/settings?instagram_error=연결이 취소되었습니다.", base));
  try {
    const token = await exchangeAuthorizationCode(code, state);
    const provider = getInstagramProvider("LIVE");
    const account = await provider.getAccount(token.accessToken);
    const scopes = await provider.getPermissions(token.accessToken);
    saveInstagramAccount({ ...account, accessToken: token.accessToken, tokenType: "bearer", expiresAt: token.expiresAt, scopes, publishMode: "LIVE" });
    return NextResponse.redirect(new URL("/settings?instagram_connected=1", base));
  } catch (error) { return NextResponse.redirect(new URL(`/settings?instagram_error=${encodeURIComponent(error instanceof Error ? error.message : "Instagram 연결 실패")}`, base)); }
}
