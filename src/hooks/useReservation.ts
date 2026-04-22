/**
 * 예약 hook
 * 하네스 규칙: link 없으면 "정보 없음", 추측 금지.
 * status 기반 분기: available_online / available_phone / walk_in_only / unavailable / unknown
 * DB 테이블 미존재(42P01/PGRST301) 시 graceful fallback (앱 크래시 방지).
 *
 * DB 컬럼 매핑 (snake_case → camelCase):
 *   walk_in_available → walkInAvailable
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { UNKNOWN_RESERVATION } from "../types/reservation";
import { getReservationLabel, hasValidReservationLink } from "../types/reservation";
import type { Reservation } from "../types/restaurant";

interface ReservationDisplay {
  reservation: Reservation | null;
  /** 예약 상태 라벨 (예: "온라인 예약 가능") */
  statusLabel: string;
  /** 예약 링크가 유효한지 */
  hasLink: boolean;
  /** 현장 방문만 가능한지 */
  walkInAvailable: boolean;
  /** 정보 없음 여부 */
  isUnknown: boolean;
}

export function useReservation(restaurantId: string) {
  return useQuery({
    queryKey: ["reservation", restaurantId],
    queryFn: async (): Promise<ReservationDisplay> => {
      // TODO: Edge Function 경유로 변경
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      // 테이블 미존재(42P01/PGRST301) → "정보 없음" fallback (앱 크래시 방지)
      if (error) {
        const isTableMissing =
          error.code === "42P01" ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist");
        if (isTableMissing) {
          return {
            reservation: null,
            statusLabel: "예약 정보 없음",
            hasLink: false,
            walkInAvailable: false,
            isUnknown: true,
          };
        }
        throw error;
      }

      // 데이터 없음 → unknown fallback
      if (!data) {
        return {
          reservation: null,
          statusLabel: "예약 정보 없음",
          hasLink: false,
          walkInAvailable: false,
          isUnknown: true,
        };
      }

      // DB 컬럼(snake_case) → Reservation 타입(camelCase) 매핑
      // data.walk_in_available 은 DB snake_case, Reservation.walkInAvailable 은 camelCase
      const reservation: Reservation = {
        status:           (data.status as Reservation["status"]) ?? "unknown",
        link:             String(data.link ?? ""),
        phone:            data.phone ? String(data.phone) : undefined,
        walkInAvailable:  Boolean(data.walk_in_available ?? false),
        note:             data.note ? String(data.note) : undefined,
      };

      return {
        reservation,
        statusLabel:      getReservationLabel(reservation.status),
        hasLink:          hasValidReservationLink(reservation),
        walkInAvailable:  reservation.walkInAvailable,
        isUnknown:        reservation.status === "unknown",
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
    retry: 1,
  });
}
