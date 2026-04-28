/**
 * fetch-reviews Edge Function
 * region에 따라 외부 출처에서 음식점 리뷰를 수집해 정규화한다.
 *  - KR: 네이버 블로그 검색 API (음식점명 + "후기"/"맛집" 부스트)
 *  - GLOBAL: Google Places API (New) Place Details — reviews 필드
 *
 * 하네스 규칙:
 *  - 모든 리뷰에 source/sourceUrl 보존 (요약 단계의 attribution 필수)
 *  - API Key는 서버 환경변수에서만 사용. 클라이언트 노출 금지.
 *  - 실패해도 빈 배열 반환 (앱 크래시 방지) — 단, 키 누락은 명확히 throw.
 *
 * 배포: supabase functions deploy fetch-reviews
 */
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import type {
  ExternalReview,
  FetchReviewsRequest,
  FetchReviewsResponse,
  ErrorResponse,
} from "../_shared/types.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: FetchReviewsRequest = await req.json();
    const { restaurantName, region, placeId, limit = 10 } = body;

    console.info(
      `[fetch-reviews] 요청 — region: ${region}, name: "${restaurantName}", placeId: ${placeId ?? "(none)"}, limit: ${limit}`
    );

    if (!restaurantName || !region) {
      const err: ErrorResponse = {
        error: "restaurantName과 region은 필수입니다.",
        code: "BAD_REQUEST",
      };
      return new Response(JSON.stringify(err), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (region !== "KR" && region !== "GLOBAL") {
      const err: ErrorResponse = {
        error: "region은 KR 또는 GLOBAL만 허용됩니다.",
        code: "INVALID_REGION",
      };
      return new Response(JSON.stringify(err), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reviews: ExternalReview[] = [];

    if (region === "KR") {
      reviews = await fetchNaverBlog(restaurantName, limit);
    } else {
      // placeId 없으면 Google Place Details 불가 — 빈 배열 반환 (요약 단계에서 처리)
      if (placeId) {
        reviews = await fetchGooglePlaceReviews(placeId, limit);
      } else {
        console.info("[fetch-reviews] GLOBAL이지만 placeId 없음 — 빈 결과 반환");
      }
    }

    console.info(`[fetch-reviews] 수집 완료 ${reviews.length}건`);

    const response: FetchReviewsResponse = {
      reviews,
      totalCount: reviews.length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.info(
      "[fetch-reviews] 예외:",
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

/**
 * 네이버 블로그 검색 API.
 *  - 검색어: "{음식점명} 후기" — 블로그 본문은 음식점 후기 가능성이 높음
 *  - description은 HTML 태그 포함 → 제거
 *  - display 최대 100, 우리는 limit만큼만 사용
 */
async function fetchNaverBlog(
  restaurantName: string,
  limit: number
): Promise<ExternalReview[]> {
  const clientId = Deno.env.get("NAVER_SEARCH_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("NAVER_SEARCH_CLIENT_SECRET") ?? "";

  if (!clientId || !clientSecret) {
    console.info("[fetchNaverBlog] API 키 없음");
    throw new Error("네이버 API 키가 설정되지 않았습니다.");
  }

  const safeLimit = Math.min(Math.max(limit, 1), 30);
  const query = `${restaurantName} 후기`;
  const url =
    `https://openapi.naver.com/v1/search/blog.json` +
    `?query=${encodeURIComponent(query)}` +
    `&display=${safeLimit}` +
    `&sort=sim`;

  console.info(`[fetchNaverBlog] 호출 query="${query}" display=${safeLimit}`);

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.info(`[fetchNaverBlog] HTTP ${res.status}: ${body}`);
    throw new Error(`네이버 블로그 API 오류: ${res.status}`);
  }

  const data = await res.json();
  const items = data.items ?? [];
  console.info(`[fetchNaverBlog] 응답 ${items.length}건`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.slice(0, safeLimit).map((item: any) => ({
    text: stripHtml(`${item.title ?? ""} ${item.description ?? ""}`).trim(),
    source: "naver_blog",
    sourceUrl: item.link,
    authorName: item.bloggername,
    publishedAt: item.postdate ? naverPostdateToIso(item.postdate) : undefined,
  })) as ExternalReview[];
}

/** "20251005" → "2025-10-05" */
function naverPostdateToIso(yyyymmdd: string): string | undefined {
  if (yyyymmdd.length !== 8) return undefined;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

/**
 * Google Places API (New) — Place Details 의 reviews 필드 사용.
 *  - 최대 5건만 반환됨 (Google 정책)
 *  - placeId는 search-restaurant 응답의 RestaurantResult.id 와 동일 형식
 */
async function fetchGooglePlaceReviews(
  placeId: string,
  limit: number
): Promise<ExternalReview[]> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";

  if (!apiKey) {
    console.info("[fetchGooglePlaceReviews] API 키 없음");
    throw new Error("구글 API 키가 설정되지 않았습니다.");
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  console.info(`[fetchGooglePlaceReviews] 호출 placeId=${placeId}`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.info(`[fetchGooglePlaceReviews] HTTP ${res.status}: ${body}`);
    throw new Error(`구글 Place Details 오류: ${res.status}`);
  }

  const data = await res.json();
  const reviews = data.reviews ?? [];
  console.info(`[fetchGooglePlaceReviews] 응답 ${reviews.length}건`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return reviews.slice(0, limit).map((r: any) => ({
    text: r.text?.text ?? r.originalText?.text ?? "",
    source: "google_review",
    sourceUrl: r.googleMapsUri,
    authorName: r.authorAttribution?.displayName,
    publishedAt: r.publishTime,
  })) as ExternalReview[];
}
