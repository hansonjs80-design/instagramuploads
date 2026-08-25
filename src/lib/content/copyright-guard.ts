import type { GeneratedBundle } from "@/lib/content/types";

export class CopyrightGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopyrightGuardError";
  }
}

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function collectNarrativeStrings(value: unknown, parentKey = ""): string[] {
  if (typeof value === "string") {
    return ["source", "sourceText"].includes(parentKey) ? [] : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectNarrativeStrings(item, parentKey));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      collectNarrativeStrings(item, key),
    );
  }
  return [];
}

export function assertTransformativeOutput(
  originalScript: string,
  bundle: GeneratedBundle,
): void {
  const sourceTokens = tokenize(originalScript);
  if (sourceTokens.length < 12) return;

  const generated = tokenize(collectNarrativeStrings(bundle).join(" ")).join(" ");
  for (let index = 0; index <= sourceTokens.length - 12; index += 1) {
    const phrase = sourceTokens.slice(index, index + 12).join(" ");
    if (generated.includes(phrase)) {
      throw new CopyrightGuardError(
        "생성 결과에서 원문과 동일한 긴 표현이 감지되었습니다. 원문을 복제하지 않도록 다시 생성해 주세요.",
      );
    }
  }
}
