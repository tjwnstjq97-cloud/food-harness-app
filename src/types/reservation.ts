/**
 * 예약 도메인 타입
 * 하네스 규칙: link 없으면 "정보 없음", 추측 금지.
 */

/** 예약 가능 상태 열거형 */
export type ReservationStatus =
  | "available_online"   // 온라인 예약 가능 + link 있음
  | "available_phone"    // 전화 예약만 가능
  | "walk_in_only"       // 예약 없이 이용만 가능
  | "unavailable"        // 예약 불가 (현장 대기)
  | "unknown";           // 정보 없음 — link 없을 때 기본값

/** 예약 정보 */
export interface Reservation {
  status: ReservationStatus;
  link: string;           // 빈 문자열 = 정보 없음. status === 'available_online'이면 필수.
  phone?: string;         // 전화 예약 번호 (status === 'available_phone'일 때)
  walkInAvailable: boolean; // 예약 없이 이용 가능 여부
  note?: string;          // 예약 관련 메모 (예: "주말 예약만 가능")
}

/** 예약 정보 표시 텍스트 반환 */
export function getReservationLabel(status: ReservationStatus): string {
  switch (status) {
    case "available_online":
      return "온라인 예약 가능";
    case "available_phone":
      return "전화 예약";
    case "walk_in_only":
      return "현장 방문만 가능";
    case "unavailable":
      return "예약 불가";
    case "unknown":
      return "예약 정보 없음";
  }
}

/** 예약 링크가 유효한지 검사 */
export function hasValidReservationLink(reservation: Reservation): boolean {
  return (
    reservation.status === "available_online" && reservation.link.length > 0
  );
}

/** 예약 정보 없음 기본값 */
export const UNKNOWN_RESERVATION: Reservation = {
  status: "unknown",
  link: "",
  walkInAvailable: false,
};
