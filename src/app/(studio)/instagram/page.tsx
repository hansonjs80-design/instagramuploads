import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { listContents } from "@/lib/db/repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instagram" };

export default async function InstagramPage() {
  const contents = await listContents({ generatedOnly: true });
  return (
    <>
      <PageHeader eyebrow="Live Preview" title="Instagram Studio" description="생성 완료 콘텐츠를 열어 4:5 카드의 문구, 브랜드 스타일, 이미지와 흐름을 실시간으로 편집하세요." />
      {contents.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contents.map((content) => (
            <Link key={content.id} href={`/library/${content.id}?tab=instagram`} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-[#a9c8c1]">
              <div className="mb-5 flex aspect-[4/2.35] items-center justify-center rounded-2xl bg-[#123c39] text-[#d9ed83]">
                <Images size={30} />
              </div>
              <p className="m-0 text-xs font-extrabold uppercase tracking-[0.08em] text-[#176b63]">{content.expertName}</p>
              <h2 className="mb-2 mt-1 line-clamp-2 text-lg font-extrabold tracking-[-0.03em]">{content.originalTitle}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#647774] group-hover:text-[#176b63]">Live Editor 열기 <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      ) : <EmptyState title="편집할 카드뉴스가 없습니다" description="새 콘텐츠에서 AI 생성을 완료하면 Live Preview Editor가 활성화됩니다." />}
    </>
  );
}
