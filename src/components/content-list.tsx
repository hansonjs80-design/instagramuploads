import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PlatformBadge, StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { ContentSummary } from "@/lib/content/types";

export function ContentList({ contents }: { contents: ContentSummary[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Content</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Date</th>
              <th aria-label="열기" />
            </tr>
          </thead>
          <tbody>
            {contents.map((content) => (
              <tr key={content.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={content.platform} />
                    <span className="text-xs font-bold text-[#526563]">{content.expertName}</span>
                  </div>
                </td>
                <td className="min-w-72">
                  <Link href={`/library/${content.id}`} className="block font-extrabold tracking-[-0.02em] hover:text-[#176b63]">
                    {content.originalTitle}
                  </Link>
                  <p className="mb-0 mt-1 line-clamp-1 max-w-md text-xs text-[#7a8987]">{content.excerpt}</p>
                </td>
                <td>
                  <div className="flex max-w-64 flex-wrap gap-1">
                    {content.tags.slice(0, 4).map((tag) => (
                      <span className="tag" key={`${tag.category}-${tag.name}`}>{tag.name}</span>
                    ))}
                  </div>
                </td>
                <td><StatusBadge status={content.status} /></td>
                <td className="whitespace-nowrap text-xs font-semibold text-[#6f7e7c]">{formatDate(content.registeredAt)}</td>
                <td>
                  <Link href={`/library/${content.id}`} className="grid size-8 place-items-center rounded-lg text-[#6f817e] hover:bg-[#e5f0ed] hover:text-[#176b63]">
                    <ArrowUpRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
