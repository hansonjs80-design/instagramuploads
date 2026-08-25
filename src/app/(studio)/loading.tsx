export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-sm font-bold text-[#607370]">
        <span className="size-4 animate-spin rounded-full border-2 border-[#aac8c1] border-t-[#176b63]" />
        콘텐츠를 불러오는 중입니다
      </div>
    </div>
  );
}
