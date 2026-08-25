import type { ContentStatus, Platform } from "@/lib/content/types";

const statusLabels: Record<ContentStatus, string> = {
  draft: "자료 저장",
  generated: "생성 완료",
  error: "확인 필요",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const color =
    status === "generated" ? "#28786d" : status === "error" ? "#b65349" : "#bb7b29";
  const background =
    status === "generated" ? "#e0f1ec" : status === "error" ? "#f8e7e4" : "#faecd3";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.69rem] font-extrabold"
      style={{ color, background }}
    >
      <span className="status-dot" style={{ background: color }} />
      {statusLabels[status]}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const isYouTube = platform === "youtube";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide ${
        isYouTube ? "bg-[#fbe9e7] text-[#a94036]" : "bg-[#f2eafb] text-[#714891]"
      }`}
    >
      {platform}
    </span>
  );
}
