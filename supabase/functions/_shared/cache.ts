/**
 * cache.ts — Edge Function 공용 캐시 유틸 (Supabase Postgres 기반).
 *
 * 정책:
 *  - service_role key 사용 (RLS 우회) — Supabase가 Edge Function에 자동 주입.
 *  - 마이그레이션 005 의 search_cache / review_summary_cache 테이블 사용.
 *  - 캐시 read 실패는 무조건 fall-through (앱 동작에 영향 X).
 *  - 캐시 write 실패도 silent (네트워크 문제로 캐시 못 써도 응답 정상).
 *
 * 토큰 절약 효과:
 *  - summarize-reviews: source_hash 같으면 Claude 호출 0회 → 토큰 비용 0.
 *  - search-restaurant: 24h TTL — 같은 검색어 재호출 시 Naver API 0회.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function isCacheEnabled(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY;
}

/** SHA-256 hex (review URL 정렬 후 해시 등에 사용) */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 검색 캐시 키: "{region}:{normalized query}" */
export function searchCacheKey(region: string, query: string): string {
  return `${region}:${query.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

/** 요약 캐시 키: "{region}:{normalized restaurant name}" */
export function summaryCacheKey(region: string, name: string): string {
  return `${region}:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

interface SearchCacheRow {
  results: unknown;
  expires_at: string;
  hit_count: number;
}

/** 만료되지 않은 search_cache 행 조회. 없으면 null. */
export async function readSearchCache(
  cacheKey: string
): Promise<unknown | null> {
  if (!isCacheEnabled()) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/search_cache?cache_key=eq.${encodeURIComponent(
      cacheKey
    )}&select=results,expires_at,hit_count`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as SearchCacheRow[];
    if (!rows.length) return null;
    const row = rows[0];
    if (new Date(row.expires_at).getTime() < Date.now()) {
      console.info(`[cache] search expired key=${cacheKey}`);
      return null;
    }
    // hit_count 증가 (fire-and-forget — 응답에 영향 X)
    bumpHitCount("search_cache", cacheKey);
    console.info(`[cache] HIT search key=${cacheKey} (${row.hit_count + 1}회)`);
    return row.results;
  } catch (e) {
    console.info("[cache] readSearchCache 예외:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** search_cache UPSERT */
export async function writeSearchCache(
  cacheKey: string,
  region: string,
  query: string,
  results: unknown,
  resultCount: number,
  ttlHours = 24
): Promise<void> {
  if (!isCacheEnabled()) return;
  try {
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
    const url = `${SUPABASE_URL}/rest/v1/search_cache?on_conflict=cache_key`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        cache_key: cacheKey,
        region,
        query,
        results,
        result_count: resultCount,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        hit_count: 0,
      }),
    });
    if (!res.ok) {
      console.info(`[cache] write search HTTP ${res.status}: ${await res.text()}`);
    } else {
      console.info(`[cache] write search OK key=${cacheKey}`);
    }
  } catch (e) {
    console.info("[cache] writeSearchCache 예외:", e instanceof Error ? e.message : String(e));
  }
}

interface SummaryCacheRow {
  summary: unknown;
  source_hash: string;
  hit_count: number;
}

/** 요약 캐시 조회 — source_hash가 일치할 때만 hit. */
export async function readSummaryCache(
  cacheKey: string,
  expectedSourceHash: string
): Promise<unknown | null> {
  if (!isCacheEnabled()) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/review_summary_cache?cache_key=eq.${encodeURIComponent(
      cacheKey
    )}&select=summary,source_hash,hit_count`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as SummaryCacheRow[];
    if (!rows.length) return null;
    const row = rows[0];
    if (row.source_hash !== expectedSourceHash) {
      console.info(
        `[cache] STALE summary key=${cacheKey} (hash mismatch, 새 리뷰 발견)`
      );
      return null;
    }
    bumpHitCount("review_summary_cache", cacheKey);
    console.info(`[cache] HIT summary key=${cacheKey} (${row.hit_count + 1}회) — Claude 호출 스킵`);
    return row.summary;
  } catch (e) {
    console.info("[cache] readSummaryCache 예외:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** 요약 캐시 UPSERT (source_hash + summary 갱신, hit_count 0 리셋) */
export async function writeSummaryCache(
  cacheKey: string,
  region: string,
  restaurantName: string,
  sourceHash: string,
  summary: unknown,
  reviewCount: number
): Promise<void> {
  if (!isCacheEnabled()) return;
  try {
    const url = `${SUPABASE_URL}/rest/v1/review_summary_cache?on_conflict=cache_key`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        cache_key: cacheKey,
        region,
        restaurant_name: restaurantName,
        source_hash: sourceHash,
        summary,
        review_count: reviewCount,
        updated_at: new Date().toISOString(),
        hit_count: 0,
      }),
    });
    if (!res.ok) {
      console.info(`[cache] write summary HTTP ${res.status}: ${await res.text()}`);
    } else {
      console.info(`[cache] write summary OK key=${cacheKey} reviews=${reviewCount}`);
    }
  } catch (e) {
    console.info("[cache] writeSummaryCache 예외:", e instanceof Error ? e.message : String(e));
  }
}

/** hit_count 증가 (fire-and-forget). 실패해도 무시. */
function bumpHitCount(table: string, cacheKey: string): void {
  if (!isCacheEnabled()) return;
  // RPC 없이 atomic increment를 위해 간단히 PATCH (race condition은 통계용이라 무시)
  fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_cache_hit`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_table: table, p_key: cacheKey }),
  }).catch(() => {
    // RPC 미생성 환경에서는 무시. 통계용일 뿐 동작에 영향 없음.
  });
}
