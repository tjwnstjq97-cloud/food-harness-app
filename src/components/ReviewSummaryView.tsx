/**
 * ReviewSummaryView — 자동 요약 결과 표시 (Phase 21+).
 * 좌: 👍 좋다는 점 / 우: 👎 아쉬운 점.
 * 하단에 출처 칩 (네이버 블로그 N건 · 구글 리뷰 M건) — Linking으로 원문 첫 건 오픈.
 *
 * 하네스 규칙:
 *  - sources 비어있으면 요약 자체를 신뢰할 수 없음 → "정보 없음" UI
 *  - 출처 첨부 없는 표시 금지
 */
import { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import {
  SUMMARY_SOURCE_LABELS,
  type ReviewSummaryV2,
} from "../types/review";

interface ReviewSummaryViewProps {
  summary: ReviewSummaryV2 | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

function ReviewSummaryViewImpl({
  summary,
  isLoading,
  isError,
  onRetry,
}: ReviewSummaryViewProps) {
  if (isLoading) {
    return (
      <View style={styles.statusBox}>
        <ActivityIndicator color="#C9651E" />
        <Text style={styles.statusText}>리뷰를 모아 요약하고 있어요…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>요약을 불러오지 못했어요.</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 하네스 규칙: 출처 없는 요약은 신뢰 불가 → "정보 없음" 처리
  const hasSources = !!summary && summary.sources.length > 0;
  const noContent =
    !summary ||
    summary.totalReviewCount === 0 ||
    (summary.positivePoints.length === 0 && summary.negativePoints.length === 0);

  if (noContent || !hasSources) {
    return (
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          아직 모인 외부 리뷰가 부족해요. (정보 없음)
        </Text>
      </View>
    );
  }

  const positives = summary.positivePoints;
  const negatives = summary.negativePoints;

  return (
    <View>
      <View style={styles.columns}>
        <View style={[styles.column, styles.positiveColumn]}>
          <Text style={[styles.columnTitle, styles.positiveTitle]}>
            👍 좋다는 점
          </Text>
          {positives.length === 0 ? (
            <Text style={styles.empty}>—</Text>
          ) : (
            positives.map((point, i) => (
              <Text key={i} style={styles.point}>
                • {point}
              </Text>
            ))
          )}
        </View>

        <View style={[styles.column, styles.negativeColumn]}>
          <Text style={[styles.columnTitle, styles.negativeTitle]}>
            👎 아쉬운 점
          </Text>
          {negatives.length === 0 ? (
            <Text style={styles.empty}>—</Text>
          ) : (
            negatives.map((point, i) => (
              <Text key={i} style={styles.point}>
                • {point}
              </Text>
            ))
          )}
        </View>
      </View>

      {/* 출처 칩 — 누르면 첫 번째 원문 링크 열기 */}
      <View style={styles.sourceRow}>
        {summary.sources.map((src) => {
          const label = SUMMARY_SOURCE_LABELS[src.type] ?? src.type;
          const firstUrl = src.urls?.[0];
          const onPress = firstUrl
            ? () =>
                Linking.openURL(firstUrl).catch(() =>
                  console.info("[ReviewSummaryView] URL 열기 실패")
                )
            : undefined;
          return (
            <TouchableOpacity
              key={src.type}
              onPress={onPress}
              disabled={!onPress}
              style={styles.sourceChip}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${src.count}건 출처 보기`}
            >
              <Text style={styles.sourceText}>
                {label} {src.count}건
                {firstUrl ? "  ↗" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        총 {summary.totalReviewCount}건의 외부 리뷰를 자동 요약한 결과입니다.
      </Text>
    </View>
  );
}

export const ReviewSummaryView = memo(ReviewSummaryViewImpl);

const styles = StyleSheet.create({
  columns: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  positiveColumn: {
    backgroundColor: "#E8F5E9",
  },
  negativeColumn: {
    backgroundColor: "#FFEBEE",
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  positiveTitle: { color: "#2E7D32" },
  negativeTitle: { color: "#C62828" },
  point: {
    fontSize: 13,
    color: "#333",
    lineHeight: 19,
  },
  empty: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    paddingVertical: 8,
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  sourceChip: {
    backgroundColor: "#F2EAD6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sourceText: {
    fontSize: 11,
    color: "#7C4A1F",
    fontWeight: "600",
  },
  footnote: {
    fontSize: 11,
    color: "#888",
    marginTop: 8,
  },
  statusBox: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#888",
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#C9651E",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
