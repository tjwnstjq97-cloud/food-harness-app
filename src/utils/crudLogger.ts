/**
 * CRUD 안전 로거
 * 하네스 규칙: 로그에 개인정보(이메일, 전화번호, user_id 실값) 금지.
 * - user_id는 마스킹 처리
 * - 민감 키워드가 포함된 값은 [REDACTED]로 치환
 * - __DEV__ 환경에서만 출력 (프로덕션 자동 억제)
 */

const SENSITIVE_KEYS = ["email", "phone", "password", "token", "key", "secret"];
const IS_DEV = process.env.NODE_ENV !== "production";

/** user_id를 마스킹 (앞 8자만 표시) */
function maskUserId(id: string): string {
  if (!id) return "[no-id]";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** 객체에서 민감 키 값을 [REDACTED]로 치환 */
function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some((s) =>
      k.toLowerCase().includes(s)
    );
    result[k] = isSensitive ? "[REDACTED]" : v;
  }
  return result;
}

export const crudLog = {
  /** SELECT 성공 */
  read: (table: string, count: number, userId?: string) => {
    if (!IS_DEV) return;
    const uid = userId ? maskUserId(userId) : "-";
    console.info(`[DB:READ] ${table} | ${count}건 | uid:${uid}`);
  },
  /** INSERT 성공 */
  insert: (table: string, payload: Record<string, unknown>) => {
    if (!IS_DEV) return;
    console.info(`[DB:INSERT] ${table}`, sanitize(payload));
  },
  /** DELETE 성공 */
  delete: (table: string, id: string) => {
    if (!IS_DEV) return;
    console.info(`[DB:DELETE] ${table} | id:${id}`);
  },
  /** 오류 — 테이블 없음은 warn으로 */
  error: (table: string, action: string, code?: string, msg?: string) => {
    if (!IS_DEV) return;
    const isTableMissing = code === "42P01";
    const method = isTableMissing ? console.warn : console.error;
    method(`[DB:ERROR] ${table}.${action} | code:${code} | ${msg}`);
  },
};
