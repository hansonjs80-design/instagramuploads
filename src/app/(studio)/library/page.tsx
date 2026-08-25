import { ContentList } from "@/components/content-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { listContents } from "@/lib/db/repository";
import { tagCategoryLabels } from "@/lib/format";
import { tagCategories, type Platform, type TagCategory } from "@/lib/content/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Library" };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string; category?: string }>;
}) {
  const params = await searchParams;
  const platform = (["youtube", "instagram"].includes(params.platform ?? "")
    ? params.platform
    : "all") as Platform | "all";
  const category = (tagCategories.includes(params.category as TagCategory)
    ? params.category
    : "all") as TagCategory | "all";
  const contents = await listContents({ query: params.q, platform, category });

  return (
    <>
      <PageHeader eyebrow="Content Library" title="모든 자료와 결과" description="전문가, 신체 부위, 운동, 증상, 생체역학 개념과 원문·분석 내용을 한 번에 검색합니다." />
      <form className="panel mb-5 grid gap-3 p-4 md:grid-cols-[minmax(240px,1fr)_180px_190px_auto]">
        <input className="field-input" name="q" defaultValue={params.q} placeholder="예: foot, walking, pronation, 전문가 이름" />
        <select className="field-select" name="platform" defaultValue={platform}>
          <option value="all">모든 플랫폼</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
        </select>
        <select className="field-select" name="category" defaultValue={category}>
          <option value="all">모든 분류</option>
          {tagCategories.map((item) => <option value={item} key={item}>{tagCategoryLabels[item]}</option>)}
        </select>
        <button className="btn-primary" type="submit">검색</button>
      </form>
      {contents.length ? <ContentList contents={contents} /> : <EmptyState title="검색 결과가 없습니다" description="검색어나 필터를 바꾸거나 새 콘텐츠를 등록해 보세요." />}
    </>
  );
}
