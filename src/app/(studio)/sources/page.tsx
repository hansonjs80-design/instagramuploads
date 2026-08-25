import { ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PlatformBadge } from "@/components/status-badge";
import { listContents } from "@/lib/db/repository";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sources" };

export default async function SourcesPage() {
  const sources = await listContents();
  return (
    <>
      <PageHeader eyebrow="Source registry" title="출처 관리" description="모든 생성 결과의 기준이 되는 제작자, 플랫폼, 원본 제목, URL과 등록일을 확인합니다." />
      {sources.length ? (
        <div className="panel overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Creator</th><th>Original content</th><th>Registered</th><th>URL</th></tr></thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td><div className="flex items-center gap-2"><PlatformBadge platform={source.platform} /><strong className="text-sm">{source.expertName}</strong></div></td>
                  <td><span className="text-sm font-bold">{source.originalTitle}</span></td>
                  <td className="text-xs text-[#6d7e7b]">{formatDate(source.registeredAt)}</td>
                  <td><a href={source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-extrabold text-[#176b63]">원본 열기 <ExternalLink size={13} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState />}
    </>
  );
}
