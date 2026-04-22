/**
 * search-restaurant Edge Function
 * region에 따라 네이버(KR) 또는 구글(GLOBAL) 검색 API를 호출한다.
 * API Key는 이 함수에서만 사용. 클라이언트에 노출 금지.
 *
 * 배포: supabase functions deploy search-restaurant
 */
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import type {
  SearchRequestBody,
  SearchResponseBody,
  RestaurantResult,
  ErrorResponse,
} from "../_shared/types.ts";

Deno.serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 검색은 공개 API — 인증 불필요 (API Key는 서버 환경변수에서만 사용)
    const body: SearchRequestBody = await req.json();
    const { query, region, limit = 20 } = body;

    console.info(`[search-restaurant] 요청 — region: ${region}, query: "${query}", limit: ${limit}`);

    if (!query || !region) {
      const err: ErrorResponse = { error: "query와 region은 필수입니다.", code: "BAD_REQUEST" };
      return new Response(JSON.stringify(err), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (region !== "KR" && region !== "GLOBAL") {
      const err: ErrorResponse = { error: "region은 KR 또는 GLOBAL만 허용됩니다.", code: "INVALID_REGION" };
      return new Response(JSON.stringify(err), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let restaurants: RestaurantResult[] = [];
    let source = "";

    if (region === "KR") {
      restaurants = await searchNaver(query, limit);
      source = "naver";
    } else {
      restaurants = await searchGoogle(query, limit);
      source = "google";
    }

    console.info(`[search-restaurant] 결과 ${restaurants.length}개 — source: ${source}`);

    const response: SearchResponseBody = {
      restaurants,
      totalCount: restaurants.length,
      hasMore: restaurants.length >= limit,
      source,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.info("[search-restaurant] 예외 발생:", err instanceof Error ? err.message : String(err));
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

/** 네이버 지역 검색 API — KR 전용
 *  display 최대 5 (네이버 API 제한)
 */
async function searchNaver(
  query: string,
  display: number
): Promise<RestaurantResult[]> {
  const clientId = Deno.env.get("NAVER_SEARCH_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("NAVER_SEARCH_CLIENT_SECRET") ?? "";

  if (!clientId || !clientSecret) {
    console.info("[searchNaver] API 키 없음 — Secrets 설정 확인 필요");
    throw new Error("네이버 API 키가 설정되지 않았습니다.");
  }

  // 네이버 local API: display 최대 5
  const safeDisplay = Math.min(display, 5);
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${safeDisplay}&sort=comment`;

  console.info(`[searchNaver] 호출 URL: ${url.replace(query, "[query]")}`);

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  console.info(`[searchNaver] HTTP 상태: ${res.status}`);

  if (!res.ok) {
    const body = await res.text();
    console.info(`[searchNaver] 오류 응답: ${body}`);
    throw new Error(`네이버 API 오류: ${res.status}`);
  }

  const data = await res.json();
  console.info(`[searchNaver] 응답 items 수: ${data.items?.length ?? 0}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.items ?? []).map((item: any) => ({
    id: `naver_${item.mapx}_${item.mapy}`,
    name: item.title.replace(/<[^>]*>/g, ""),
    region: "KR" as const,
    category: item.category ?? "",
    address: item.roadAddress || item.address,
    phone: item.telephone,
    latitude: Number(item.mapy) / 1e7,
    longitude: Number(item.mapx) / 1e7,
    source: "naver",
  }));
}

/** 구글 Places API (New) Text Search — GLOBAL 전용
 *  구버전(maps.googleapis.com) 과 다른 엔드포인트/인증 방식 사용.
 *  Google Cloud Console에서 "Places API (New)" 활성화 필요.
 */
async function searchGoogle(
  query: string,
  limit: number
): Promise<RestaurantResult[]> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "";

  if (!apiKey) {
    console.info("[searchGoogle] API 키 없음 — Secrets 설정 확인 필요");
    throw new Error("구글 API 키가 설정되지 않았습니다.");
  }

  // Places API (New): POST + X-Goog-Api-Key 헤더 + FieldMask 필수
  const url = "https://places.googleapis.com/v1/places:searchText";

  console.info(`[searchGoogle] Places API (New) 호출 중... query: "${query}"`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.types,places.location,places.nationalPhoneNumber",
    },
    body: JSON.stringify({
      textQuery: query + " restaurant",
      maxResultCount: Math.min(limit, 20),
      languageCode: "en",
    }),
  });

  console.info(`[searchGoogle] HTTP 상태: ${res.status}`);

  if (!res.ok) {
    const body = await res.text();
    console.info(`[searchGoogle] 오류 응답: ${body}`);
    throw new Error(`구글 Places API (New) 오류: ${res.status} — ${body}`);
  }

  const data = await res.json();
  console.info(`[searchGoogle] 응답 places 수: ${data.places?.length ?? 0}`);

  if (!data.places || data.places.length === 0) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.places.slice(0, limit).map((item: any) => ({
    id: item.id ?? "",
    name: item.displayName?.text ?? "",
    region: "GLOBAL" as const,
    category: (item.types ?? [])[0]?.replace(/_/g, " ") ?? "restaurant",
    address: item.formattedAddress ?? "",
    phone: item.nationalPhoneNumber ?? undefined,
    latitude: item.location?.latitude ?? 0,
    longitude: item.location?.longitude ?? 0,
    source: "google",
  }));
}
