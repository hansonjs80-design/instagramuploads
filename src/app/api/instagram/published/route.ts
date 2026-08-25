import { NextResponse } from "next/server";
import { listPublishedPosts } from "@/services/instagram/publishing";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ posts: listPublishedPosts() }); }
