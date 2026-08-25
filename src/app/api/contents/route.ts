import { NextResponse } from "next/server";
import { createContent, listContents } from "@/lib/db/repository";
import { InputError, parseCreateContentInput } from "@/lib/content/validation";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ contents: listContents() });
}

export async function POST(request: Request) {
  try {
    const input = parseCreateContentInput(await request.json());
    const content = createContent(input);
    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "요청 JSON 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "콘텐츠 저장에 실패했습니다.";
    if (message.includes("UNIQUE constraint failed: content_items.source_url")) {
      return NextResponse.json({ error: "이미 등록된 출처 URL입니다." }, { status: 409 });
    }
    console.error("Failed to create content", error);
    return NextResponse.json({ error: "콘텐츠 저장에 실패했습니다." }, { status: 500 });
  }
}
