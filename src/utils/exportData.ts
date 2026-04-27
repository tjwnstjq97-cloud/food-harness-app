/**
 * 사용자 데이터 내보내기 유틸 (Phase E)
 *
 * 동작:
 *  - 히스토리 / 즐겨찾기를 JSON 문자열로 직렬화
 *  - React Native Share API로 시스템 공유 시트 호출
 *
 * 보안:
 *  - 사용자가 명시적으로 자기 데이터를 내보내는 액션 → 권한 OK
 *  - 다른 사용자 데이터를 섞지 않도록 caller가 user_id 필터링한 결과만 전달
 *  - 비밀번호/토큰 같은 민감 필드는 입력 자체에 포함되지 않음 (history/favorites 테이블엔 없음)
 */
import { Share, Platform } from "react-native";
import type { HistoryRow, FavoriteRow } from "../types/restaurant";

interface ExportPayload {
  exportedAt: string;
  version: 1;
  userId: string;
  history: HistoryRow[];
  favorites: FavoriteRow[];
  counts: {
    history: number;
    favorites: number;
  };
}

export function buildExportPayload(args: {
  userId: string;
  history: HistoryRow[];
  favorites: FavoriteRow[];
}): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    userId: args.userId,
    history: args.history,
    favorites: args.favorites,
    counts: {
      history: args.history.length,
      favorites: args.favorites.length,
    },
  };
}

/**
 * 시스템 공유 시트로 JSON 텍스트 공유.
 * - iOS: message로 공유 (메모, 메일, 메신저로 붙여넣기 가능)
 * - Android: message로 텍스트 공유
 */
export async function shareUserDataExport(args: {
  userId: string;
  history: HistoryRow[];
  favorites: FavoriteRow[];
}): Promise<{ shared: boolean }> {
  const payload = buildExportPayload(args);
  const json = JSON.stringify(payload, null, 2);

  // RN Share message 길이는 사실상 OS 클립보드 한도까지 OK
  const result = await Share.share(
    {
      title: "Food Harness 데이터 내보내기",
      message: json,
    },
    {
      // iOS: subject는 메일 등에서 제목으로 사용
      subject: `food-harness-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`,
    }
  );

  if (Platform.OS === "ios") {
    return { shared: result.action === Share.sharedAction };
  }
  // Android: dismissedAction일 수 있음
  return { shared: result.action !== Share.dismissedAction };
}
