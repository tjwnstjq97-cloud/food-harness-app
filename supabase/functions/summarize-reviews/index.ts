/**
 * summarize-reviews Edge Function
 * 외부에서 수집한 리뷰들을 Anthropic Claude API로 긍정/부정 포인트로 요약한다.
 *
 * 하네스 규칙:
 *  - 출처(sources) 필드를 반드시 채워서 반환 (validator 통과 필수)
 *  - 긍정/부정 분리 — Claude에게 JSON 스키마로 강제
 *  - API Key는 서버 환경변수에서만. 클라이언트 노출 금지.
 *  - 입력 리뷰 0건이면 빈 요약 반환 (앱 크래시 방지)
 *
 * 배포: supabase functions deploy summarize-reviews
 *      supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import type {
  ExternalReview,
  SummarizeReviewsRequest,
  SummarizeReviewsResponse,
  SummarySource,
  ErrorResponse,
} from "../_shared/types.ts";
import {
  sha256Hex,
  summaryCacheKey,
  readSummaryCache,
  writeSummaryCache,
} from "../_shared/cache.ts";

const MODEL = "claude-haiku-4-5";
const MAX_URLS_PER_SOURCE = 5;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: SummarizeReviewsRequest = await req.json();
    const { restaurantName, reviews, region = "KR" } = body;

    console.info(
      `[summarize-reviews] 요청 — name: "${restaurantName}", reviews: ${reviews?.length ?? 0}건`
    );

    if (!restaurantName || !Array.isArray(reviews)) {
      const err: ErrorResponse = {
        error: "restaurantName과 reviews는 필수입니다.",
        code: "BAD_REQUEST",
      };
      return new Response(JSON.stringify(err), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 입력 0건이면 빈 요약 반환 (Anthropic 호출 안 함, 비용 절약)
    if (reviews.length === 0) {
      const empty: SummarizeReviewsResponse = {
        positivePoints: [],
        negativePoints: [],
        signatureMenus: [],
        waitingSignal: null,
        totalReviewCount: 0,
        sources: [],
        generatedAt: new Date().toISOString(),
      };
      return new Response(JSON.stringify(empty), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sources = aggregateSources(reviews);

    // ── 캐시 조회: 같은 음식점 + 같은 리뷰 URL 셋이면 Claude 호출 스킵 ──
    // source_hash = 정렬된 sourceUrl 목록의 SHA-256.
    // 새 블로그/카페 글이 등장하면 hash가 바뀌어 자동으로 stale 처리됨.
    const cacheKey = summaryCacheKey(region, restaurantName);
    const sortedUrls = reviews
      .map((r) => r.sourceUrl ?? `${r.source}:${(r.text ?? "").slice(0, 40)}`)
      .sort()
      .join("|");
    const sourceHash = await sha256Hex(sortedUrls);

    const cached = (await readSummaryCache(cacheKey, sourceHash)) as
      | SummarizeReviewsResponse
      | null;
    if (cached) {
      // 캐시 hit — Claude 호출 0회. sources/totalReviewCount는 현재 fetch 결과로 갱신해서 반환
      // (요약 본문은 캐시 그대로, 메타만 fresh).
      const hit: SummarizeReviewsResponse = {
        ...cached,
        totalReviewCount: reviews.length,
        sources,
        generatedAt: cached.generatedAt, // 원래 생성 시각 유지 (사용자에게 정확한 정보)
      };
      return new Response(JSON.stringify(hit), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    const summary = await callAnthropicSummary(restaurantName, reviews);

    const response: SummarizeReviewsResponse = {
      positivePoints: summary.positivePoints,
      negativePoints: summary.negativePoints,
      signatureMenus: summary.signatureMenus,
      waitingSignal: summary.waitingSignal,
      totalReviewCount: reviews.length,
      sources,
      generatedAt: new Date().toISOString(),
    };

    // 캐시 갱신 (실패해도 응답에 영향 없음 — silent fall-through)
    await writeSummaryCache(
      cacheKey,
      region,
      restaurantName,
      sourceHash,
      response,
      reviews.length
    );

    console.info(
      `[summarize-reviews] 완료 — 긍정 ${summary.positivePoints.length}, 부정 ${summary.negativePoints.length}, 메뉴 ${summary.signatureMenus.length}, 출처 ${sources.length}종 (cache MISS)`
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.info(
      "[summarize-reviews] 예외:",
      err instanceof Error ? err.message : String(err)
    );
    const error: ErrorResponse = {
      error: err instanceof Error ? err.message : "서버 오류",
      code: "INTERNAL_ERROR",
    };
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** 리뷰 배열에서 source별 카운트/URL 집계 */
function aggregateSources(reviews: ExternalReview[]): SummarySource[] {
  const map = new Map<string, { count: number; urls: string[] }>();
  for (const r of reviews) {
    const key = r.source || "unknown";
    const entry = map.get(key) ?? { count: 0, urls: [] };
    entry.count += 1;
    if (r.sourceUrl && entry.urls.length < MAX_URLS_PER_SOURCE) {
      entry.urls.push(r.sourceUrl);
    }
    map.set(key, entry);
  }
  return [...map.entries()].map(([type, { count, urls }]) => ({
    type,
    count,
    urls,
  }));
}

/**
 * Anthropic API 호출 — JSON 모드 강제.
 *  - 입력은 리뷰 본문만 잘라서 토큰 절약
 *  - 시스템 프롬프트로 "긍정/부정 한 줄씩, 한국어, 추측 금지" 명시
 *  - 응답 파싱 실패 시 throw → 호출자가 500 반환
 */
async function callAnthropicSummary(
  restaurantName: string,
  reviews: ExternalReview[]
): Promise<{
  positivePoints: string[];
  negativePoints: string[];
  signatureMenus: { name: string; mentionCount: number }[];
  waitingSignal: {
    label: string;
    evidence: string;
    minMinutes?: number;
    maxMinutes?: number;
    sourceCount: number;
  } | null;
}> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  if (!apiKey) {
    console.info("[callAnthropicSummary] ANTHROPIC_API_KEY 없음");
    throw new Error("Anthropic API 키가 설정되지 않았습니다.");
  }

  // 리뷰 본문만 — 각 800자 컷 (토큰 절약)
  const reviewBlock = reviews
    .map((r, i) => {
      const text = (r.text ?? "").slice(0, 800);
      return `[${i + 1}] (출처: ${r.source}) ${text}`;
    })
    .join("\n\n");

  const systemPrompt = `당신은 한국 음식점 리뷰 분석 전문가입니다. 주어진 리뷰들을 읽고 다음 JSON 형식으로만 응답하세요. 다른 텍스트 절대 금지.

규칙:
- 한국어로 작성
- positivePoints/negativePoints 각 항목은 짧고 명확한 한 줄 (15자 이내), 최대 6개씩
- 리뷰에 명시되지 않은 내용 추측 금지
- signatureMenus: 리뷰에서 실제로 언급된 메뉴명만 추출 (가게명/지역명/일반 단어 제외)
  - mentionCount: 해당 메뉴가 리뷰에서 언급된 횟수 (정수)
  - 자주 언급된 순으로 최대 5개
  - "맛있다", "추천" 같은 형용사/동사는 메뉴 아님
  - 메뉴명만 (예: "베이글", "라떼", "파스타") — 설명/가격 금지
- waitingSignal: 웨이팅/대기/줄/오픈런/혼잡이 리뷰에 명시된 경우에만 작성
  - 근거가 없으면 반드시 null
  - label: 사용자에게 보여줄 짧은 한 줄 (예: "주말 대기 길음", "오픈런 권장", "약 20~40분")
  - evidence: 리뷰에 나온 근거를 짧게 요약. 추측 금지
  - minMinutes/maxMinutes: 리뷰에 숫자 시간이 명시된 경우에만 정수로 입력
  - sourceCount: 웨이팅 단서가 언급된 리뷰 개수

응답 형식 (이것만 출력):
{"positivePoints": ["...", "..."], "negativePoints": ["...", "..."], "signatureMenus": [{"name": "...", "mentionCount": 5}, ...], "waitingSignal": null}`;

  const userPrompt = `음식점: ${restaurantName}

리뷰들:
${reviewBlock}

위 리뷰들을 요약해서 JSON으로만 응답하세요.`;

  console.info(`[callAnthropicSummary] Anthropic 호출 model=${MODEL}`);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.info(`[callAnthropicSummary] HTTP ${res.status}: ${body}`);
    throw new Error(`Anthropic API 오류: ${res.status}`);
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textContent = (data.content ?? []).find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.type === "text"
  );
  const raw = textContent?.text?.trim() ?? "";

  console.info(`[callAnthropicSummary] 응답 길이 ${raw.length}자`);

  // 모델이 ```json ... ``` 으로 감싸는 경우 대비
  const jsonText = extractJson(raw);

  let parsed: {
    positivePoints?: unknown;
    negativePoints?: unknown;
    signatureMenus?: unknown;
    waitingSignal?: unknown;
  };
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.info(`[callAnthropicSummary] JSON 파싱 실패: ${raw.slice(0, 200)}`);
    throw new Error("Anthropic 응답을 JSON으로 파싱하지 못했습니다.");
  }

  const positivePoints = Array.isArray(parsed.positivePoints)
    ? parsed.positivePoints.filter((s): s is string => typeof s === "string").slice(0, 6)
    : [];
  const negativePoints = Array.isArray(parsed.negativePoints)
    ? parsed.negativePoints.filter((s): s is string => typeof s === "string").slice(0, 6)
    : [];
  const signatureMenus = Array.isArray(parsed.signatureMenus)
    ? parsed.signatureMenus
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((m: any) => m && typeof m.name === "string" && m.name.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => ({
          name: String(m.name).trim().slice(0, 30),
          mentionCount: Number(m.mentionCount ?? 1) || 1,
        }))
        .slice(0, 5)
    : [];

  const waitingSignal = normalizeWaitingSignal(parsed.waitingSignal);

  return { positivePoints, negativePoints, signatureMenus, waitingSignal };
}

/** 응답에서 JSON만 추출 (```json ... ``` 또는 그대로) */
function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence?.[1]) return fence[1].trim();
  // {...} 첫 매칭
  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace?.[0]) return brace[0];
  return raw;
}

function normalizeWaitingSignal(value: unknown):
  | {
      label: string;
      evidence: string;
      minMinutes?: number;
      maxMinutes?: number;
      sourceCount: number;
    }
  | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "";
  const evidence =
    typeof raw.evidence === "string" ? raw.evidence.trim().slice(0, 120) : "";
  const sourceCount = Math.max(1, Number(raw.sourceCount ?? 1) || 1);
  if (!label || !evidence) return null;

  const minMinutes = Number(raw.minMinutes);
  const maxMinutes = Number(raw.maxMinutes);
  return {
    label,
    evidence,
    ...(Number.isFinite(minMinutes) && minMinutes >= 0
      ? { minMinutes: Math.round(minMinutes) }
      : {}),
    ...(Number.isFinite(maxMinutes) && maxMinutes >= 0
      ? { maxMinutes: Math.round(maxMinutes) }
      : {}),
    sourceCount,
  };
}
