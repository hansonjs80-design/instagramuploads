import Link from "next/link";
import { Settings } from "lucide-react";
import { LivePreviewEditor } from "@/components/live-preview-editor";
import { PageHeader } from "@/components/page-header";
import { demoCards, demoCreative, demoInstagramEngine } from "@/lib/content/demo";
import { getBrandProfile } from "@/lib/db/repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Preview Demo" };

export default async function PreviewPage() {
  const brand = await getBrandProfile();
  return (
    <>
      <PageHeader
        eyebrow="Interactive demo"
        title="Live Preview Editor"
        description="API 키나 등록 자료 없이도 움직임노트 브랜드 카드 편집과 1080×1350 PNG 내보내기를 바로 체험할 수 있습니다. 데모 변경은 브라우저를 닫으면 사라집니다."
        action={<Link href="/settings" className="btn-secondary"><Settings size={15} /> Brand Settings</Link>}
      />
      <LivePreviewEditor contentId="demo" initialCards={demoCards} creative={demoCreative} brand={brand} engine={demoInstagramEngine} demoMode />
    </>
  );
}
