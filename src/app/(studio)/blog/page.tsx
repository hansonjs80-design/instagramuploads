import Link from "next/link";
import { ArrowRight, BookOpenText, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { listContents } from "@/lib/db/repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const contents = await listContents({ generatedOnly: true });
  return (
    <>
      <PageHeader eyebrow="Naver Blog" title="블로그 초안" description="원문 번역이 아닌 검색 의도, 원리, 쉬운 설명과 운영자의 해석을 중심으로 구성된 글을 확인합니다." action={<Link href="/blog/keywords" className="btn-secondary"><Search size={15} /> Keyword Planner</Link>} />
      {contents.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {contents.map((content) => (
            <Link key={content.id} href={`/library/${content.id}?tab=blog`} className="panel group flex items-start gap-4 p-5 hover:border-[#aac7c1]">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e5f1ee] text-[#176b63]"><BookOpenText size={19} /></span>
              <span className="min-w-0">
                <span className="block text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-[#7c8b89]">{content.expertName}</span>
                <strong className="mt-1 block line-clamp-2 tracking-[-0.02em]">{content.originalTitle}</strong>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#176b63]">글 미리보기 <ArrowRight size={13} /></span>
              </span>
            </Link>
          ))}
        </div>
      ) : <EmptyState title="생성된 블로그 글이 없습니다" />}
    </>
  );
}
