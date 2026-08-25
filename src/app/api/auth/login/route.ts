import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth/provider";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: unknown; email?: unknown; password?: unknown };
    const identifier = typeof body.identifier === "string" ? body.identifier : body.email;
    if (typeof identifier !== "string" || typeof body.password !== "string" || !await authProvider.verifyCredentials(identifier, body.password)) return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, await authProvider.createSession(identifier), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 24 * 60 * 60, priority: "high" });
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "로그인 설정 오류" }, { status: 500 }); }
}
