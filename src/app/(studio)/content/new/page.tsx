import { NewContentForm } from "@/components/new-content-form";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "New Content" };

export default function NewContentPage() {
  return (
    <>
      <PageHeader
        eyebrow="New source"
        title="전문가 콘텐츠 등록"
        description="출처와 원문을 먼저 기록합니다. 생성물은 원문 복제가 아니라 브랜드 관점의 분석과 새로운 설명으로 구성됩니다."
      />
      <NewContentForm />
    </>
  );
}
