import { createHash } from "node:crypto";
import type { ClassificationValue, ContentClassification, KeywordSet, SourceEvidence } from "@/services/source-analysis/types";

const rules = {
  bodyRegions: [
    ["FOOT", ["foot", "feet", "발 ", "발바닥", "족부"]], ["BIG TOE", ["big toe", "hallux", "엄지발가락"]],
    ["ANKLE", ["ankle", "발목"]], ["KNEE", ["knee", "무릎"]], ["HIP", ["hip", "고관절"]],
    ["PELVIS", ["pelvis", "pelvic", "골반"]], ["LUMBAR", ["lumbar", "low back", "허리"]],
    ["THORACIC", ["thoracic", "등뼈", "흉추"]], ["RIB CAGE", ["rib cage", "ribcage", "흉곽", "갈비뼈"]],
    ["SHOULDER", ["shoulder", "어깨"]], ["ELBOW", ["elbow", "팔꿈치"]], ["WRIST", ["wrist", "손목"]],
    ["HAND", ["hand", "손가락", "손 "]], ["NECK", ["neck", "목 통증", "경추"]], ["HEAD", ["head", "머리"]],
  ],
  symptoms: [
    ["PAIN", ["pain", "ache", "아프", "통증"]], ["STIFFNESS", ["stiff", "뻣뻣"]], ["WEAKNESS", ["weak", "약화"]],
    ["INSTABILITY", ["instability", "불안정"]], ["LIMITED ROM", ["limited range", "range of motion", "가동범위", "가동성 제한"]],
    ["TINGLING", ["tingling", "numb", "저림"]], ["FATIGUE", ["fatigue", "피로"]], ["BALANCE", ["balance", "균형"]],
    ["POSTURE", ["posture", "자세"]], ["MOBILITY", ["mobility", "가동성"]], ["CONTROL", ["control", "조절"]],
    ["PERFORMANCE", ["performance", "퍼포먼스"]],
  ],
  movements: [
    ["WALKING", ["walking", "walk", "걷기", "걸을"]], ["RUNNING", ["running", "run", "달리기", "러닝"]],
    ["SQUAT", ["squat", "스쿼트"]], ["LUNGE", ["lunge", "런지"]], ["HINGE", ["hinge", "힙힌지"]],
    ["PUSH", ["push", "밀기"]], ["PULL", ["pull", "당기기"]], ["ROTATION", ["rotation", "회전"]],
    ["GAIT", ["gait", "보행"]], ["BREATHING", ["breathing", "breath", "호흡"]], ["REACH", ["reach", "뻗기"]],
    ["STEP", ["step", "스텝"]], ["JUMP", ["jump", "점프"]], ["LANDING", ["landing", "착지"]],
    ["SINGLE LEG", ["single leg", "한발", "외발"]], ["STANCE", ["stance", "지지"]], ["TRANSFER", ["transfer", "이동"]],
  ],
  biomechanics: [
    ["PRONATION", ["pronation", "회내"]], ["SUPINATION", ["supination", "회외"]],
    ["INTERNAL ROTATION", ["internal rotation", "내회전"]], ["EXTERNAL ROTATION", ["external rotation", "외회전"]],
    ["FLEXION", ["flexion", "굴곡"]], ["EXTENSION", ["extension", "신전"]], ["ADDUCTION", ["adduction", "내전"]],
    ["ABDUCTION", ["abduction", "외전"]], ["LOAD TRANSFER", ["load transfer", "하중 이동", "하중 전달"]],
    ["PRESSURE DISTRIBUTION", ["pressure distribution", "압력 분배", "압력"]], ["CENTER OF MASS", ["center of mass", "무게중심"]],
    ["RELATIVE MOTION", ["relative motion", "상대 움직임"]], ["GROUND REACTION FORCE", ["ground reaction", "지면반력"]],
    ["MOBILITY", ["mobility", "가동성"]], ["STABILITY", ["stability", "안정성"]],
    ["MOTOR CONTROL", ["motor control", "운동 조절"]], ["STACKING", ["stacking", "스태킹"]], ["COMPENSATION", ["compensation", "보상"]],
  ],
  exercises: [
    ["MOBILITY", ["mobility", "가동성 운동"]], ["STRENGTH", ["strength", "근력"]], ["CONTROL", ["motor control", "조절 운동"]],
    ["ISOMETRIC", ["isometric", "등척성"]], ["ECCENTRIC", ["eccentric", "편심성"]], ["PLYOMETRIC", ["plyometric", "플라이오"]],
    ["GAIT DRILL", ["gait drill", "보행 훈련"]], ["BREATHING", ["breathing exercise", "호흡 운동"]], ["BALANCE", ["balance exercise", "균형 운동"]],
    ["STRETCH", ["stretch", "스트레칭"]], ["LOADED", ["loaded", "부하"]], ["REHAB", ["rehab", "재활"]],
  ],
} satisfies Record<string, Array<[string, string[]]>>;

export function classifyContent(text: string, evidence: SourceEvidence[]): ContentClassification {
  const haystack = ` ${text.toLocaleLowerCase()} `;
  const evidenceIds = evidence.map((item) => item.id);
  const classify = (items: Array<[string, string[]]>, fallback?: string) => {
    const matched = items.flatMap(([value, terms]) => {
      const hits = terms.filter((term) => haystack.includes(term.toLocaleLowerCase()));
      return hits.length ? [classification(value, Math.min(98, 70 + hits.length * 8), evidenceIds, false)] : [];
    });
    if (matched.length) return matched.map((item, index) => ({ ...item, primary: index === 0 }));
    return fallback ? [classification(fallback, 35, evidenceIds.slice(0, 1), true)] : [];
  };

  const bodyRegions = classify(rules.bodyRegions, "FULL BODY");
  const symptoms = classify(rules.symptoms, "NO SYMPTOM / EDUCATION");
  const movements = classify(rules.movements);
  const biomechanics = classify(rules.biomechanics);
  const exercises = classify(rules.exercises, "EDUCATION ONLY");
  const isPain = symptoms.some((item) => item.value === "PAIN");
  const isExercise = exercises.some((item) => item.value !== "EDUCATION ONLY");
  const audiences = [classification(isPain ? "PAIN PATIENT" : "GENERAL PUBLIC", isPain ? 78 : 60, evidenceIds, false)];
  const purposes = [classification(isExercise ? "EXERCISE" : isPain ? "PAIN EXPLANATION" : "EDUCATION", 76, evidenceIds, false)];
  const difficulty = [classification(biomechanics.length > 2 ? "INTERMEDIATE" : "BEGINNER", 66, evidenceIds, false)];
  const intentsKr = [classification(isPain ? "CAUSE" : isExercise ? "HOW TO" : "INFORMATION", 74, evidenceIds, false)];
  const intentsEn = [classification(isPain ? "WHY" : isExercise ? "HOW TO" : "EDUCATION", 74, evidenceIds, false)];
  const primaryBody = bodyRegions[0]?.value ?? "MOVEMENT";
  const primaryKr = koreanKeyword(primaryBody, isPain, isExercise);
  const primaryEn = englishKeyword(primaryBody, isPain, isExercise);
  return {
    bodyRegions, symptoms, movements, biomechanics, exercises, audiences, purposes, difficulty,
    searchIntentsKr: intentsKr, searchIntentsEn: intentsEn,
    keywords: {
      naver: keywordSet(primaryKr, koreanRelated(bodyRegions, movements, biomechanics, isPain), evidenceIds),
      instagramKr: keywordSet(primaryKr, koreanRelated(bodyRegions, movements, biomechanics, isPain).slice(0, 5), evidenceIds),
      instagramEn: keywordSet(primaryEn, englishRelated(bodyRegions, movements, biomechanics, isPain), evidenceIds),
      englishBlog: keywordSet(primaryEn, englishRelated(bodyRegions, movements, biomechanics, isPain), evidenceIds),
    },
    topicClusters: bodyRegions.slice(0, 3).map((item) => ({ ...item, primary: item === bodyRegions[0] })),
    seriesSuggestions: [{ ...classification(isPain ? "PAIN CHECK" : `${primaryBody} BASICS`, 72, evidenceIds, false), reason: isPain ? "통증 검색 의도와 쉬운 설명 구조에 적합" : "반복 가능한 기초 교육 주제에 적합" }],
  };
}

export function mergeClassification(previous: ContentClassification, next: ContentClassification): ContentClassification {
  const merged = structuredClone(next);
  for (const key of ["bodyRegions", "symptoms", "movements", "biomechanics", "exercises", "audiences", "purposes", "difficulty", "searchIntentsKr", "searchIntentsEn", "topicClusters"] as const) {
    const protectedValues = previous[key].filter((item) => item.locked || item.state === "USER_MODIFIED" || item.state === "USER_CONFIRMED");
    merged[key] = [...protectedValues, ...next[key].filter((candidate) => !protectedValues.some((item) => item.value === candidate.value))];
  }
  for (const platform of ["naver", "instagramKr", "instagramEn", "englishBlog"] as const) {
    for (const group of ["primary", "secondary", "longTail", "related"] as const) {
      const kept = previous.keywords[platform][group].filter((item) => item.locked || item.state !== "AI_SUGGESTED");
      merged.keywords[platform][group] = [...kept, ...next.keywords[platform][group].filter((candidate) => !kept.some((item) => item.value === candidate.value))];
    }
  }
  merged.seriesSuggestions = next.seriesSuggestions;
  return merged;
}

function classification(value: string, confidence: number, evidenceIds: string[], fallback: boolean): ClassificationValue {
  return { id: createHash("sha1").update(value).digest("hex").slice(0, 12), value, confidence, state: "AI_SUGGESTED", evidenceIds, primary: false, locked: false, ...(fallback ? { confidence: 35 } : {}) };
}
function keywordSet(primary: string, related: string[], evidenceIds: string[]): KeywordSet {
  const unique = [...new Set(related.filter((item) => item !== primary))];
  return {
    primary: [{ ...classification(primary, 78, evidenceIds, false), primary: true }],
    secondary: unique.slice(0, 5).map((value) => classification(value, 68, evidenceIds, false)),
    longTail: longTails(primary).map((value) => classification(value, 64, evidenceIds, false)),
    related: unique.slice(5, 10).map((value) => classification(value, 55, evidenceIds, false)),
  };
}
function koreanKeyword(body: string, pain: boolean, exercise: boolean) { const name = ({ FOOT: "발", "BIG TOE": "엄지발가락", ANKLE: "발목", KNEE: "무릎", HIP: "고관절", PELVIS: "골반", LUMBAR: "허리", SHOULDER: "어깨", NECK: "목" } as Record<string, string>)[body] || "움직임"; return `${name} ${pain ? "통증" : exercise ? "운동" : "움직임"}`; }
function englishKeyword(body: string, pain: boolean, exercise: boolean) { const name = body === "FULL BODY" ? "movement" : body.toLocaleLowerCase(); return `${name} ${pain ? "pain" : exercise ? "exercises" : "mechanics"}`; }
function koreanRelated(body: ClassificationValue[], movement: ClassificationValue[], mechanics: ClassificationValue[], pain: boolean) { return [...body.map((item) => koreanKeyword(item.value, pain, false)), ...movement.map((item) => item.value === "WALKING" ? "보행" : item.value === "RUNNING" ? "러닝" : item.value.toLocaleLowerCase()), ...mechanics.map((item) => item.value.toLocaleLowerCase())]; }
function englishRelated(body: ClassificationValue[], movement: ClassificationValue[], mechanics: ClassificationValue[], pain: boolean) { return [...body.map((item) => englishKeyword(item.value, pain, false)), ...movement.map((item) => item.value.toLocaleLowerCase()), ...mechanics.map((item) => item.value.toLocaleLowerCase())]; }
function longTails(primary: string) { return /[가-힣]/.test(primary) ? [`걸을 때 ${primary}`, `${primary} 원인`, `${primary} 운동`] : [`${primary} when walking`, `what causes ${primary}`, `${primary} exercises`]; }
