import { BrandSettingsForm } from "@/components/brand-settings-form";
import { PageHeader } from "@/components/page-header";
import { copyrightRules } from "@/lib/content/rules";
import { getBrandProfile } from "@/lib/db/repository";
import { isOpenAiConfigured } from "@/lib/ai/generate";
import { InstagramSettingsPanel } from "@/components/instagram-settings-panel";
import { SystemStatus } from "@/components/system-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brand Settings" };

export default async function SettingsPage() {
  const profile = await getBrandProfile();
  const apiReady = isOpenAiConfigured();
  return (
    <>
      <PageHeader eyebrow="Brand system" title="Brand Settings" description="같은 말투, 시각 규칙, CTA와 출처 시스템이 모든 카드뉴스와 블로그에 반복되도록 브랜드 기준을 관리합니다." />
      <div className={`mb-5 rounded-2xl border px-5 py-4 text-sm font-bold ${apiReady ? "border-[#c6dfd8] bg-[#eaf5f1] text-[#25685f]" : "border-[#ead3aa] bg-[#fff8e9] text-[#8a6326]"}`}>
        OpenAI API · {apiReady ? "연결 설정 완료" : ".env.local에 OPENAI_API_KEY 설정 필요"}
      </div>
      <InstagramSettingsPanel />
      <SystemStatus />
      <BrandSettingsForm initialProfile={profile} />
      <section className="panel mt-5 p-6">
        <h2 className="section-title">고정 저작권 안전장치</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">{copyrightRules.map((rule) => <div className="rounded-xl bg-[#f4f8f6] px-3 py-2 text-xs font-bold text-[#536763]" key={rule}>✓ {rule}</div>)}</div>
      </section>
    </>
  );
}
