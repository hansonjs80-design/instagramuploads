import "server-only";

import { AiConfigurationError } from "@/lib/ai/generate";
import { getBrandProfile } from "@/lib/db/repository";

type ImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

export async function generateCardImage(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiConfigurationError();

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
  const brand = getBrandProfile();
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: `Create an original editorial image for the Korean rehabilitation brand ${brand.brandName}. ${prompt}\nBrand visual direction: ${brand.visualStyle}. Rules: ${brand.imageStyleRules.join("; ")}. Palette reference: ${brand.primaryColor}, ${brand.secondaryColor}, ${brand.accentColor}. Composition must remain useful when cropped to a 4:5 portrait card. Anatomically responsible, no embedded text, no logos, no watermarks, and do not imitate another creator's image or design.`,
      size: "1024x1536",
      quality: "medium",
      output_format: "png",
      n: 1,
    }),
    signal: AbortSignal.timeout(180_000),
  });

  const payload = (await response.json()) as ImageResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `이미지 생성 요청이 실패했습니다 (${response.status}).`);
  }
  const encoded = payload.data?.[0]?.b64_json;
  if (!encoded) throw new Error("생성된 이미지 데이터를 찾을 수 없습니다.");
  return `data:image/png;base64,${encoded}`;
}
