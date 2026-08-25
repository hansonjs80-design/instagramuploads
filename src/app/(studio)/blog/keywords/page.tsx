import { KeywordResearch } from "@/components/keyword-research";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Naver Keyword Planner" };

export default function KeywordPlannerPage() {
  return <><PageHeader eyebrow="Naver Blog Mode" title="Keyword Planner" description="검색량만 좇지 않고 검색 의도, 콘텐츠 관련성, 브랜드 적합성과 전문성 적합도를 함께 평가합니다." /><KeywordResearch /></>;
}
