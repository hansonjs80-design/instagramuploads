export type InstagramErrorCode = "TOKEN_EXPIRED" | "PERMISSION_MISSING" | "PERSONAL_ACCOUNT" | "MEDIA_NOT_PUBLIC" | "RATE_LIMIT" | "CONTAINER_ERROR" | "PUBLISH_TIMEOUT" | "DUPLICATE_PUBLISH" | "CONFIGURATION" | "API_ERROR";

const messages: Record<InstagramErrorCode, string> = {
  TOKEN_EXPIRED: "Instagram 연결이 만료되었습니다. 다시 연결해주세요.",
  PERMISSION_MISSING: "Instagram 게시 권한이 없습니다.",
  PERSONAL_ACCOUNT: "자동 게시에는 Instagram 프로페셔널 계정이 필요합니다.",
  MEDIA_NOT_PUBLIC: "Instagram에서 이미지를 불러올 수 없습니다.",
  RATE_LIMIT: "현재 계정의 API 게시 한도에 도달했습니다.",
  CONTAINER_ERROR: "Instagram이 카드 이미지를 처리하지 못했습니다.",
  PUBLISH_TIMEOUT: "게시 결과 확인이 지연되고 있습니다. 재게시하지 않고 상태를 먼저 확인합니다.",
  DUPLICATE_PUBLISH: "이미 게시된 버전입니다.",
  CONFIGURATION: "Instagram API 설정이 완료되지 않았습니다.",
  API_ERROR: "Instagram API 요청에 실패했습니다.",
};

export class InstagramProviderError extends Error {
  constructor(public readonly code: InstagramErrorCode, public readonly debug?: { status?: number; metaCode?: number; requestId?: string }) {
    super(messages[code]);
    this.name = "InstagramProviderError";
  }
}
