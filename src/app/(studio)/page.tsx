import Link from "next/link";
import { ArrowRight, BookOpenText, FilePlus2, Images, LibraryBig, Sparkles } from "lucide-react";
import { ContentList } from "@/components/content-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getDashboardStats, listContents } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recent = listContents({ limit: 6 });
  const statCards = [
    { label: "Source Library", value: stats.total, icon: LibraryBig, note: "등록된 원본 자료" },
    { label: "Ready to publish", value: stats.generated, icon: Sparkles, note: "생성 완료 콘텐츠" },
    { label: "YouTube", value: stats.youtube, icon: BookOpenText, note: "영상 기반 출처" },
    { label: "Instagram", value: stats.instagram, icon: Images, note: "포스트 기반 출처" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content workspace"
        title="좋은 해석은 출처에서 시작됩니다"
        description="전문가의 아이디어를 기록하고, 브랜드의 언어로 다시 설명한 카드뉴스와 블로그 초안을 만드세요."
        action={<Link href="/content/new" className="btn-primary"><FilePlus2 size={16} /> 새 콘텐츠</Link>}
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel p-5">
              <div className="flex items-start justify-between">
                <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#73817f]">{item.label}</span>
                <span className="grid size-9 place-items-center rounded-xl bg-[#e6f1ee] text-[#176b63]"><Icon size={17} /></span>
              </div>
              <strong className="mt-4 block text-3xl font-extrabold tracking-[-0.05em]">{item.value}</strong>
              <span className="mt-1 block text-xs text-[#81908e]">{item.note}</span>
            </div>
          );
        })}
      </section>

      <section className="panel mb-6 overflow-hidden bg-[#123c39] text-white">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#d9ed83]">Brand workflow</span>
            <h2 className="mb-2 mt-2 text-2xl font-extrabold tracking-[-0.04em]">5~9장의 흐름을 보면서 바로 편집하세요</h2>
            <p className="m-0 max-w-2xl text-sm leading-6 text-[#c9dbd7]">AI가 만든 후크와 콘텐츠 각도를 선택하고, 브랜드 색·타이포그래피·이미지를 Live Preview에서 조정한 뒤 1080×1350 PNG로 내보낼 수 있습니다.</p>
          </div>
          <Link href="/preview" className="inline-flex items-center gap-2 rounded-xl bg-[#d9ed83] px-4 py-3 text-sm font-extrabold text-[#173b37]">데모 미리보기 <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">최근 콘텐츠</h2>
        <Link href="/library" className="text-xs font-extrabold text-[#176b63]">전체 라이브러리 →</Link>
      </div>
      {recent.length ? <ContentList contents={recent} /> : <EmptyState />}
    </>
  );
}
