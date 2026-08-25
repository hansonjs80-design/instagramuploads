import Link from "next/link";
import { FilePlus2, LibraryBig } from "lucide-react";

export function EmptyState({
  title = "아직 저장된 자료가 없습니다",
  description = "첫 전문가 콘텐츠를 등록하면 출처, 분석, 카드뉴스와 블로그 초안을 한 곳에서 관리할 수 있습니다.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="panel flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#e3f1ed] text-[#176b63]">
        <LibraryBig size={22} />
      </span>
      <h2 className="m-0 text-lg font-extrabold tracking-[-0.03em]">{title}</h2>
      <p className="mb-5 mt-2 max-w-md text-sm leading-6 text-[#6d7d7b]">{description}</p>
      <Link href="/content/new" className="btn-primary">
        <FilePlus2 size={16} /> 새 콘텐츠 등록
      </Link>
    </div>
  );
}
