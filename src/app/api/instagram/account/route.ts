import { NextResponse } from "next/server";
import { disconnectInstagramAccount, getInstagramAccount, saveInstagramAccount } from "@/services/instagram/account-repository";
import { getPublishMode } from "@/services/instagram/config";
import { getInstagramProvider } from "@/services/instagram/provider";

export const runtime = "nodejs";

export async function GET() { return NextResponse.json({ account: getInstagramAccount(), configuredMode: getPublishMode() }); }

export async function POST() {
  if (getPublishMode() !== "MOCK") return NextResponse.json({ error: "LIVE 모드에서는 OAuth 연결 버튼을 사용하세요." }, { status: 400 });
  const provider = getInstagramProvider("MOCK");
  const remote = await provider.getAccount("mock-access-token");
  const scopes = await provider.getPermissions("mock-access-token");
  return NextResponse.json({ account: saveInstagramAccount({ ...remote, accessToken: "mock-access-token", tokenType: "mock", expiresAt: null, scopes, publishMode: "MOCK" }) });
}

export async function DELETE() { disconnectInstagramAccount(); return NextResponse.json({ disconnected: true }); }
