import Link from "next/link";

export default function NotFound() {
  return <div className="panel mx-auto mt-24 max-w-lg p-8 text-center"><h1 className="text-xl font-extrabold">콘텐츠를 찾을 수 없습니다</h1><p className="text-sm text-[#6d7d7a]">삭제되었거나 주소가 올바르지 않습니다.</p><Link href="/library" className="btn-primary mt-3">Library로 돌아가기</Link></div>;
}
