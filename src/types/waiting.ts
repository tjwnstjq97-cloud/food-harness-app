/**
 * 웨이팅 도메인 타입
 * 하네스 규칙: evidence 없으면 "추정" 표기 필수. 근거 없는 시간 표시 금지.
 */

/** 웨이팅 정보 신뢰도 */
export type WaitingConfidence = "realtime" | "estimated" | "unknown";

/** 웨이팅 정보 */
export interface Waiting {
  minutes: number;          // 예상 대기 시간(분). 0 = 대기 없음.
  evidence: string;         // 근거 출처. 빈 문자열이면 confidence는 estimated/unknown이어야 함.
  confidence: WaitingConfidence;
  estimatedRange?: WaitingRange; // confidence === "estimated"일 때 범위
  updatedAt?: string;       // 데이터 갱신 시각 (ISO 8601)
}

/** 대기 시간 범위 (추정 시) */
export interface WaitingRange {
  min: number;  // 분
  max: number;  // 분
}

/** 웨이팅 정보 없음 기본값 */
export const UNKNOWN_WAITING: Waiting = {
  minutes: 0,
  evidence: "",
  confidence: "unknown",
};

// (Phase 17 정리) formatWaitingLabel / isEstimated 제거 — useWaiting 훅 내부에서
// displayText / isEstimated 를 직접 계산하고 있어 외부 export 불필요.
