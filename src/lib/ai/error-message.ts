export type GenerationFailure = {
  code: "OPENAI_QUOTA_EXCEEDED" | "OPENAI_AUTH_FAILED" | "OPENAI_NOT_CONFIGURED" | "OPENAI_RATE_LIMITED" | "GENERATION_FAILED";
  message: string;
  status: number;
  actionUrl?: string;
};

const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";
const OPENAI_KEYS_URL = "https://platform.openai.com/api-keys";

export function describeGenerationFailure(error: unknown): GenerationFailure {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (/exceeded your current quota|insufficient_quota|billing details/i.test(raw)) {
    return {
      code: "OPENAI_QUOTA_EXCEEDED",
      message: "OpenAI API 사용 한도 또는 크레딧이 없습니다. API 결제 설정에서 결제수단이나 크레딧을 활성화한 뒤 다시 시도해 주세요. 원본 자료는 라이브러리에 안전하게 저장되어 있습니다.",
      status: 429,
      actionUrl: OPENAI_BILLING_URL,
    };
  }

  if (/incorrect api key|invalid[_ -]?api[_ -]?key|authentication/i.test(raw)) {
    return {
      code: "OPENAI_AUTH_FAILED",
      message: "OpenAI API 키가 올바르지 않거나 만료되었습니다. Production의 OPENAI_API_KEY를 다시 확인해 주세요.",
      status: 401,
      actionUrl: OPENAI_KEYS_URL,
    };
  }

  if (/OPENAI_API_KEY.*설정되지 않았|api key.*not (configured|set)/i.test(raw)) {
    return {
      code: "OPENAI_NOT_CONFIGURED",
      message: "OpenAI API 키가 설정되지 않았습니다. Production 환경변수 OPENAI_API_KEY를 확인해 주세요.",
      status: 503,
      actionUrl: OPENAI_KEYS_URL,
    };
  }

  if (/rate limit|too many requests/i.test(raw)) {
    return {
      code: "OPENAI_RATE_LIMITED",
      message: "OpenAI API의 일시적인 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",
      status: 429,
    };
  }

  return {
    code: "GENERATION_FAILED",
    message: raw || "AI 콘텐츠 생성에 실패했습니다.",
    status: 502,
  };
}
