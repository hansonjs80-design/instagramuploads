import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Images, Languages, Lightbulb, Quote, ShieldCheck } from "lucide-react";
import { GenerateButton } from "@/components/generate-button";
import { LivePreviewEditor } from "@/components/live-preview-editor";
import { PlatformBadge, StatusBadge } from "@/components/status-badge";
import { SourceAnalysisPanel } from "@/components/source-analysis-panel";
import { describeGenerationFailure } from "@/lib/ai/error-message";
import { getBrandProfile, getContentById } from "@/lib/db/repository";
import { formatDate, tagCategoryLabels } from "@/lib/format";
import { outputTypeLabels } from "@/lib/content/types";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "instagram", label: "Instagram KR", icon: Images },
  { key: "blog", label: "Naver Blog KR", icon: FileText },
  { key: "analysis", label: "Analysis", icon: Lightbulb },
  { key: "english", label: "Instagram EN", icon: Languages },
  { key: "source", label: "Source", icon: Quote },
] as const;

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [content, brand] = await Promise.all([getContentById(id), getBrandProfile()]);
  if (!content) notFound();
  const hasInstagramKr = Boolean(content.instagram && content.creative && content.instagramEngine);
  const hasInstagramEn = Boolean(content.instagramEn);
  const hasNaver = Boolean(content.blog);
  const generated = hasInstagramKr || hasInstagramEn || hasNaver;
  const defaultGeneratedTab = hasInstagramKr ? "instagram" : hasNaver ? "blog" : hasInstagramEn ? "english" : "source";
  const allowedTabs = tabs.map((tab) => tab.key);
  const activeTab = allowedTabs.includes(query.tab as (typeof allowedTabs)[number])
    ? query.tab!
    : generated
      ? defaultGeneratedTab
      : "source";
  const lastFailure = content.lastError ? describeGenerationFailure(content.lastError) : null;

  return (
    <>
      <header className="mb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <PlatformBadge platform={content.platform} />
          <StatusBadge status={content.status} />
          <span className="text-xs font-bold text-[#748381]">{content.expertName} · {formatDate(content.registeredAt)} · {content.selectedOutputTypes.map((type) => outputTypeLabels[type]).join(" · ")}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="page-title max-w-4xl">{content.originalTitle}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">{content.tags.map((tag) => <span className="tag" key={`${tag.category}-${tag.name}`}>{tagCategoryLabels[tag.category]} · {tag.name}</span>)}</div>
          </div>
          {!generated ? <GenerateButton contentId={content.id} initialOutputTypes={content.selectedOutputTypes} /> : <a className="btn-secondary" href={content.sourceUrl} target="_blank" rel="noreferrer">원본 열기 <ExternalLink size={15} /></a>}
        </div>
      </header>

      {lastFailure && !generated ? <div className="mb-4 rounded-xl border border-[#efc9c3] bg-[#fff4f2] px-4 py-3 text-sm font-bold text-[#99453c]"><p className="m-0 leading-6">최근 생성 오류: {lastFailure.message}</p>{lastFailure.actionUrl ? <a className="mt-2 inline-flex rounded-lg border border-[#efc9c3] bg-white px-3 py-2 text-xs underline" href={lastFailure.actionUrl} target="_blank" rel="noreferrer">OpenAI 결제 설정 열기</a> : null}</div> : null}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-[#d9e4e1] bg-white p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <Link key={tab.key} href={`/library/${id}?tab=${tab.key}`} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold ${activeTab === tab.key ? "bg-[#dff1ed] text-[#145f57]" : "text-[#6d7d7a] hover:bg-[#f3f7f5]"}`}><Icon size={14} />{tab.label}</Link>;
        })}
      </div>

      {activeTab === "instagram" ? (
        hasInstagramKr ? <LivePreviewEditor contentId={content.id} initialCards={content.instagram!.cards} creative={content.creative!} brand={brand} engine={content.instagramEngine} outputType="INSTAGRAM_KR" /> : <GenerationPending />
      ) : null}

      {activeTab === "blog" ? (
        content.blog ? (
          <div className="space-y-5">
            <NaverSeoSummary seo={content.blog.naverSeo} />
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <article className="panel prose-preview p-7 md:p-10">
              <span className="eyebrow">{brand.brandName} · Blog Preview</span>
              <h1 className="!mt-3">{content.blog.title}</h1>
              <p className="rounded-2xl bg-[#f2f6f4] p-5 !text-base font-bold">{content.blog.hook}</p>
              <ListSection title="이런 분께 도움이 돼요" items={content.blog.whoThisIsFor} />
              <BlogSection title="왜 이런 불편감이 생길까요?" text={content.blog.problemExplanation} />
              <BlogSection title="전문가가 말한 핵심 개념" text={content.blog.expertConcept} />
              <BlogSection title="쉽게 말하면 이런 뜻이에요" text={content.blog.easyExplanation} />
              <BlogSection title="임상적으로 해석하면" text={content.blog.clinicalInterpretation} />
              <ListSection title="실제로는 이렇게 적용해볼 수 있어요" items={content.blog.applications} />
              <ListSection title="흔히 하는 실수 / 주의점" items={content.blog.precautions} />
              <div className="my-8 rounded-2xl border-l-4 p-5" style={{ borderColor: brand.accentColor, background: `${brand.accentColor}18` }}><strong>한 줄 정리</strong><p className="!mb-0 !mt-2">{content.blog.summary}</p></div>
              <BlogSection title="출처" text={content.blog.sourceText} />
              <p className="mt-8 border-t border-[#dce6e3] pt-5 font-extrabold" style={{ color: brand.primaryColor }}>{content.blog.relatedContentCta}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">{Object.values(content.blog.naverSeo.tags).flat().map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            </article>
            <aside className="panel sticky top-5 p-5"><h2 className="section-title">Brand check</h2><div className="mt-4 space-y-2 text-xs font-bold text-[#5c6f6b]"><p>✓ {brand.toneOfVoice}</p><p>✓ CTA · {brand.signatureCta}</p><p>✓ 출처 형식 · {brand.sourceCitationStyle}</p><p>✓ 브랜드 해시태그 고정 포함</p></div></aside>
          </div>
          </div>
        ) : <GenerationPending />
      ) : null}

      {activeTab === "analysis" ? (
        content.analysis ? (
          <div className="space-y-4">
            <AnalysisSection title="Key Claims" items={content.analysis.keyClaims} />
            <AnalysisSection title="Biomechanics / Rehabilitation Principles" items={content.analysis.biomechanicsPrinciples} />
            <TextAnalysis title="Clinical Interpretation" text={content.analysis.clinicalInterpretation} />
            <TextAnalysis title="Easy Explanation" text={content.analysis.easyExplanation} />
            <AnalysisSection title="Practical Application" items={content.analysis.practicalApplication} />
            <AnalysisSection title="Precautions" items={content.analysis.precautions} />
            {content.creative ? <section className="panel p-6"><h2 className="section-title">Content Angles</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{content.creative.contentAngles.map((angle) => <div className="rounded-xl bg-[#f3f7f5] p-4" key={angle.type}><strong className="text-sm">{angle.title}</strong><p className="mb-0 mt-2 text-xs leading-5 text-[#62736f]">{angle.description}</p></div>)}</div></section> : null}
          </div>
        ) : <GenerationPending />
      ) : null}

      {activeTab === "english" ? (
        hasInstagramEn ? <LivePreviewEditor contentId={content.id} initialCards={content.instagramEn!.instagramCards} creative={{ ...content.instagramEn!.creative, templateKey: content.templateKey }} brand={brand} engine={content.instagramEn!.instagramEngine} outputType="INSTAGRAM_EN" /> : <GenerationPending />
      ) : null}

      {activeTab === "source" ? (
        <div className="space-y-5">
        {content.sourceAnalysis ? <SourceAnalysisPanel initialAnalysis={content.sourceAnalysis} contentId={content.id} initialOutputTypes={content.generatedOutputTypes.length ? content.generatedOutputTypes : content.selectedOutputTypes} /> : null}
        <section className="panel p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e4f0ed] text-[#176b63]"><ShieldCheck size={19} /></span><div><h2 className="section-title">Original Content</h2><p className="section-note">출처 추적을 위한 보관 원문</p></div></div>
          <dl className="grid gap-4 text-sm md:grid-cols-2"><div><dt className="field-label">Expert</dt><dd className="m-0 font-bold">{content.expertName}</dd></div><div><dt className="field-label">Platform</dt><dd className="m-0 font-bold capitalize">{content.platform}</dd></div><div><dt className="field-label">Original title</dt><dd className="m-0 font-bold">{content.originalTitle}</dd></div><div><dt className="field-label">Registered</dt><dd className="m-0 font-bold">{formatDate(content.registeredAt)}</dd></div></dl>
          <a href={content.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 break-all text-sm font-extrabold text-[#176b63]">{content.sourceUrl} <ExternalLink size={14} /></a>
          <div className="mt-6 rounded-2xl bg-[#f5f8f7] p-5"><h3 className="m-0 text-sm font-extrabold">원본 스크립트</h3><p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-7 text-[#51635f]">{content.originalScript}</p></div>
          {content.experienceNote ? <div className="mt-4 rounded-2xl border border-[#d7e4e1] p-5"><h3 className="m-0 text-sm font-extrabold">내 경험 / 관찰</h3><p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-7 text-[#51635f]">{content.experienceNote}</p></div> : null}
        </section>
        </div>
      ) : null}
    </>
  );
}

function GenerationPending() { return <div className="panel p-8 text-center"><h2 className="text-lg font-extrabold">아직 생성 결과가 없습니다</h2><p className="text-sm text-[#6d7d7a]">상단의 AI 생성 버튼을 눌러 브랜드 분석과 콘텐츠 초안을 만드세요.</p></div>; }
function BlogSection({ title, text }: { title: string; text: string }) { return <section><h2>{title}</h2><p>{text}</p></section>; }
function ListSection({ title, items }: { title: string; items: string[] }) { return <section><h2>{title}</h2><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
function AnalysisSection({ title, items }: { title: string; items: string[] }) { return <section className="panel p-6"><h2 className="section-title">{title}</h2><ul className="mt-4 space-y-2">{items.map((item) => <li className="rounded-xl bg-[#f4f8f6] p-3 text-sm leading-6 text-[#4f625e]" key={item}>{item}</li>)}</ul></section>; }
function TextAnalysis({ title, text }: { title: string; text: string }) { return <section className="panel p-6"><h2 className="section-title">{title}</h2><p className="mb-0 mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4f625e]">{text}</p></section>; }

function NaverSeoSummary({ seo }: { seo: import("@/lib/content/types").NaverSeoPlan }) {
  const scoreEntries = [
    ["Search Intent", seo.seoScore.searchIntent, 20], ["Title", seo.seoScore.titleQuality, 10],
    ["Originality", seo.seoScore.originality, 15], ["Expertise", seo.seoScore.expertiseInterpretation, 15],
    ["Readability", seo.seoScore.readability, 10], ["Structure", seo.seoScore.structure, 10],
    ["Images", seo.seoScore.imageUsefulness, 5], ["Source", seo.seoScore.sourceTransparency, 5],
    ["Brand", seo.seoScore.brandConsistency, 5], ["Related", seo.seoScore.relatedContent, 5],
  ] as const;
  return <div className="space-y-4">
    <section className="panel grid gap-5 p-6 lg:grid-cols-[1fr_180px]">
      <div><span className="eyebrow">Naver Blog Mode</span><h2 className="mb-2 mt-2 text-xl font-extrabold">{seo.recommendedTitle}</h2><div className="flex flex-wrap gap-1.5"><span className="tag">Primary · {seo.primaryKeyword}</span>{seo.searchIntents.map((intent) => <span className="tag" key={intent}>{intent}</span>)}</div><p className="mb-0 mt-3 text-xs text-[#687976]">Topic Cluster · {seo.topicCluster.name} / {seo.topicCluster.relatedTopics.join(" · ")}</p></div>
      <div className="grid place-items-center rounded-2xl bg-[#203A5B] p-4 text-white"><span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-[#88C9C1]">Quality Check</span><strong className="text-4xl">{seo.seoScore.total}</strong><span className="text-xs font-bold">/ 100 · {seo.readiness === "ready" ? "Ready" : "Needs Revision"}</span></div>
    </section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="panel p-5"><h3 className="section-title">Alternative Titles</h3><div className="mt-3 space-y-2">{seo.titleCandidates.map((candidate) => <div className="rounded-xl bg-[#f4f8f6] p-3" key={candidate.type}><span className="text-[0.62rem] font-extrabold uppercase text-[#176b63]">{candidate.type}</span><p className="mb-0 mt-1 text-sm font-bold">{candidate.title}</p></div>)}</div></section>
      <section className="panel p-5"><h3 className="section-title">NAVER SEO CHECK</h3><div className="mt-3 grid grid-cols-2 gap-2">{scoreEntries.map(([label, score, max]) => <div className="flex justify-between rounded-lg bg-[#f4f8f6] px-3 py-2 text-xs" key={label}><span>{label}</span><strong>{score}/{max}</strong></div>)}</div>{seo.keywordWarnings.map((warning) => <p className="rounded-lg bg-[#fff4f2] p-3 text-xs font-bold text-[#9b473d]" key={warning}>{warning}</p>)}</section>
      <section className="panel p-5"><h3 className="section-title">Image Plan</h3><ol className="mt-3 space-y-2">{seo.imagePlan.map((image, index) => <li className="rounded-xl border border-[#e0e8e6] p-3" key={`${image.position}-${index}`}><strong className="text-xs">{index + 1}. {image.role} · {image.position}</strong><p className="mb-0 mt-1 text-xs leading-5 text-[#61726f]">{image.brief}</p><span className="mt-1 block text-[0.68rem] text-[#879592]">Caption · {image.caption}</span></li>)}</ol></section>
      <section className="panel p-5"><h3 className="section-title">Originality & Brand Check</h3><div className="mt-3 space-y-2">{[...seo.originalityChecks, ...seo.brandChecks].map((check, index) => <div className="flex items-start gap-2 text-xs" key={`${check.label}-${index}`}><span className={check.passed ? "text-[#23806f]" : "text-[#b44f45]"}>{check.passed ? "✓" : "!"}</span><span><strong>{check.label}</strong><span className="block text-[#74827f]">{check.note}</span></span></div>)}</div>{seo.relatedContentTitles.length ? <div className="mt-4 border-t border-[#e0e8e6] pt-3"><strong className="text-xs">같이 읽으면 이해가 더 쉬워요</strong>{seo.relatedContentTitles.map((title) => <p className="mb-0 mt-2 text-xs text-[#176b63]" key={title}>→ {title}</p>)}</div> : null}</section>
    </div>
  </div>;
}
