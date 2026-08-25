import { NewContentForm } from "@/components/new-content-form";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "New Content" };

export default function NewContentPage() {
  return (
    <>
      <PageHeader
        eyebrow="New source"
        title="전문가 콘텐츠 등록"
        description="링크 하나로 공개 정보를 분석하고 자동 분류합니다. 접근할 수 없는 자막이나 영상 내용은 추측하지 않으며, 필요하면 자료를 추가해 분석을 업그레이드할 수 있습니다."
      />
      <NewContentForm />
    </>
  );
}
