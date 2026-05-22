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
  type SummaryWaitingSignal,
  type ReviewSummaryV2,
} from "../types/review";

interface ReviewSummaryViewProps {
  summary: ReviewSummaryV2 | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1;
}

function getSafeWaitingSignal(
  signal: SummaryWaitingSignal | null | undefined
): SummaryWaitingSignal | null {
  if (!signal?.label?.trim() || !signal.evidence?.trim()) return null;
  if (!isPositiveInteger(signal.sourceCount)) return null;

  const hasMin = signal.minMinutes != null;
  const hasMax = signal.maxMinutes != null;
  const minOk =
    !hasMin ||
    (Number.isInteger(signal.minMinutes) && Number(signal.minMinutes) >= 0);
  const maxOk =
    !hasMax ||
    (Number.isInteger(signal.maxMinutes) && Number(signal.maxMinutes) >= 0);
  if (!minOk || !maxOk) return { ...signal, minMinutes: undefined, maxMinutes: undefined };
  if (
    hasMin &&
    hasMax &&
    Number(signal.maxMinutes) < Number(signal.minMinutes)
  ) {
    return { ...signal, minMinutes: undefined, maxMinutes: undefined };
  }
  return signal;
}

function getConfidenceLabel(totalReviewCount: number, sourceCount: number): string {
  if (totalReviewCount >= 20 && sourceCount >= 2) return "신뢰도 높음";
  if (totalReviewCount >= 5 && sourceCount >= 1) return "신뢰도 보통";
  return "근거 부족";
}

function getRepresentativeReview(summary: ReviewSummaryV2) {
  return summary.representativeReviews?.find(
    (review) => review.text.trim().length > 0 && review.source.trim().length > 0
  ) ?? null;
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
      <View style={styles.statusBox} testID="review-summary-empty">
        <Text style={styles.statusTitle}>정보 없음</Text>
        <Text style={styles.statusText}>
          출처가 충분하지 않아 요약을 표시하지 않습니다.
        </Text>
      </View>
    );
  }

  const positives = summary.positivePoints;
  const negatives = summary.negativePoints;
  const safeWaitingSignal = getSafeWaitingSignal(summary.waitingSignal);
  const sourceCount = summary.sources.length;
  const confidenceLabel = getConfidenceLabel(summary.totalReviewCount, sourceCount);
  const primarySource = summary.sources[0];
  const primarySourceLabel = primarySource
    ? SUMMARY_SOURCE_LABELS[primarySource.type] ?? primarySource.type
    : "정보 없음";
  const representativeReview = getRepresentativeReview(summary);
  const representativeSourceLabel = representativeReview
    ? SUMMARY_SOURCE_LABELS[representativeReview.source] ?? representativeReview.source
    : "정보 없음";
  const waitingRange =
    safeWaitingSignal?.minMinutes != null && safeWaitingSignal.maxMinutes != null
      ? `약 ${safeWaitingSignal.minMinutes}~${safeWaitingSignal.maxMinutes}분`
      : "시간 정보 없음";

  return (
    <View testID="review-summary-view">
      <View style={styles.evidencePanel} testID="review-summary-evidence">
        <View style={styles.evidenceHeaderRow}>
          <Text style={styles.evidenceLabel}>
            출처 {sourceCount}종 · 외부 리뷰 {summary.totalReviewCount}건
          </Text>
          <View
            style={[
              styles.confidencePill,
              confidenceLabel === "근거 부족" && styles.confidencePillWeak,
            ]}
            testID="review-summary-confidence"
          >
            <Text
              style={[
                styles.confidencePillText,
                confidenceLabel === "근거 부족" && styles.confidencePillWeakText,
              ]}
            >
              {confidenceLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.evidenceText} numberOfLines={2}>
          대표 근거: {primarySourceLabel}
          {primarySource ? ` ${primarySource.count}건` : ""}
        </Text>
        <View
          style={styles.representativeBox}
          testID={representativeReview ? "review-summary-representative-review" : "review-summary-representative-empty"}
        >
          <Text style={styles.representativeTitle}>대표 리뷰 문장</Text>
          {representativeReview ? (
            <Text style={styles.representativeText} numberOfLines={3}>
              {representativeReview.text} · {representativeSourceLabel}
            </Text>
          ) : (
            <Text style={styles.representativeEmptyText}>
              정보 없음 · 출처 문장이 확인될 때만 표시합니다.
            </Text>
          )}
        </View>
      </View>

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

      {safeWaitingSignal && (
        <View style={styles.waitingEvidenceBox} testID="review-summary-waiting-signal">
          <View style={styles.waitingEvidenceHeader}>
            <Text style={styles.waitingEvidenceTitle}>웨이팅 신호</Text>
            <Text style={styles.waitingEvidenceCount}>
              근거 {safeWaitingSignal.sourceCount}건
            </Text>
          </View>
          <Text style={styles.waitingEvidenceLabel} numberOfLines={1}>
            {safeWaitingSignal.label} · {waitingRange}
          </Text>
          <Text style={styles.waitingEvidenceText} numberOfLines={2}>
            {safeWaitingSignal.evidence}
          </Text>
        </View>
      )}
      {!safeWaitingSignal && (
        <View style={styles.waitingUnknownBox} testID="review-summary-waiting-unknown">
          <Text style={styles.waitingUnknownTitle}>웨이팅 정보 없음</Text>
          <Text style={styles.waitingUnknownText}>
            출처에서 확인된 웨이팅 근거가 없어 표시하지 않습니다.
          </Text>
        </View>
      )}

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
              <Text style={styles.sourceText} numberOfLines={1}>
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
    flexWrap: "wrap",
    gap: 10,
  },
  column: {
    flex: 1,
    minWidth: 180,
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
  evidencePanel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: "#F8FAFC",
    padding: 10,
    gap: 4,
    marginBottom: 10,
  },
  evidenceHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  evidenceLabel: {
    flex: 1,
    minWidth: 160,
    fontSize: 12,
    color: "#2F2A24",
    fontWeight: "800",
  },
  confidencePill: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E8F5E9",
  },
  confidencePillWeak: {
    backgroundColor: "#F1F5F9",
  },
  confidencePillText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "800",
  },
  confidencePillWeakText: {
    color: "#6F665B",
  },
  evidenceText: {
    fontSize: 12,
    color: "#6F665B",
    lineHeight: 17,
  },
  representativeBox: {
    marginTop: 4,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#E6EAF0",
    gap: 3,
  },
  representativeTitle: {
    fontSize: 11,
    color: "#6F665B",
    fontWeight: "800",
  },
  representativeText: {
    fontSize: 12,
    color: "#2F2A24",
    lineHeight: 17,
    fontWeight: "600",
  },
  representativeEmptyText: {
    fontSize: 12,
    color: "#9A8F80",
    lineHeight: 17,
  },
  waitingEvidenceBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F4D8C4",
    backgroundColor: "#FFF7F0",
    padding: 10,
    gap: 5,
  },
  waitingEvidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  waitingEvidenceTitle: {
    fontSize: 12,
    color: "#C9651E",
    fontWeight: "800",
  },
  waitingEvidenceCount: {
    fontSize: 11,
    color: "#7C4A1F",
    fontWeight: "700",
  },
  waitingEvidenceLabel: {
    fontSize: 12,
    color: "#2F2A24",
    fontWeight: "800",
  },
  waitingEvidenceText: {
    fontSize: 12,
    color: "#6F665B",
    lineHeight: 17,
  },
  waitingUnknownBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: "#F8FAFC",
    padding: 10,
    gap: 4,
  },
  waitingUnknownTitle: {
    fontSize: 12,
    color: "#6F665B",
    fontWeight: "800",
  },
  waitingUnknownText: {
    fontSize: 12,
    color: "#9A8F80",
    lineHeight: 17,
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
    minHeight: 32,
    maxWidth: "100%",
    justifyContent: "center",
    borderRadius: 14,
  },
  sourceText: {
    flexShrink: 1,
    minWidth: 0,
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
    textAlign: "center",
  },
  statusTitle: {
    fontSize: 14,
    color: "#555",
    fontWeight: "800",
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
